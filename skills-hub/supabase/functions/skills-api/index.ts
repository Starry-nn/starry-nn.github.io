import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import JSZip from "npm:jszip@3.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = "private-skills";
const SESSION_HOURS = 12;
const MAX_ZIP_BYTES = 6 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 16 * 1024 * 1024;
const MAX_FILES = 160;
const CATEGORIES = new Set(["项目发现", "BP 初筛", "行业研究", "商业尽调", "财务分析", "法务合规", "IC 材料", "投后管理", "募资与 LP", "基金运营", "人才与关系", "会议与知识", "数据与表格", "内容交付", "自动化与工具", "其他"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

type User = { id: string; username: string; role: string; force_password_change: boolean; created_at: string };

function json(payload: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...cors, ...extra, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function binary(body: Uint8Array, filename: string) {
  return new Response(arrayBuffer(body), { headers: { ...cors, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9_.-]/g, "-")}"`, "Cache-Control": "no-store" } });
}

function apiPath(request: Request) {
  const path = new URL(request.url).pathname;
  const marker = path.indexOf("/api/");
  return marker >= 0 ? path.slice(marker) : path.endsWith("/api") ? "/api" : "/";
}

function bytesToHex(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function arrayBuffer(value: Uint8Array) {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
}

function hexToBytes(value: string) {
  if (!/^[a-f0-9]+$/i.test(value) || value.length % 2) throw new Error("invalid_hex");
  return new Uint8Array(value.match(/.{2}/g)!.map(part => Number.parseInt(part, 16)));
}

async function sha256(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return bytesToHex(await crypto.subtle.digest("SHA-256", arrayBuffer(bytes)));
}

async function passwordHash(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations: 310000 }, key, 256);
  return bytesToHex(bits);
}

function randomToken(prefix: string, bytes = 32) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return prefix + btoa(String.fromCharCode(...raw)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function publicUser(row: Record<string, unknown>): User {
  return { id: String(row.id), username: String(row.username), role: String(row.role), force_password_change: Boolean(row.force_password_change), created_at: String(row.created_at) };
}

function validateUsername(input: unknown) {
  const value = String(input ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/.test(value)) throw new Error("用户名需为 3-32 位字母、数字、点、下划线或短横线");
  return value;
}

function validatePassword(input: unknown, temporary = false) {
  const value = String(input ?? "");
  const minimum = temporary ? 8 : 10;
  if (value.length < minimum || value.length > 128) throw new Error(`密码长度需为 ${minimum}-128 位`);
  if (!temporary && (!/[A-Za-z]/.test(value) || !/[^A-Za-z]/.test(value))) throw new Error("密码需同时包含字母和数字或符号");
  return value;
}

async function ensureAdmin() {
  const username = (Deno.env.get("SKILLS_ADMIN_USERNAME") ?? "").trim();
  const salt = (Deno.env.get("SKILLS_ADMIN_PASSWORD_SALT") ?? "").trim();
  const hash = (Deno.env.get("SKILLS_ADMIN_PASSWORD_HASH") ?? "").trim();
  if (!username || !salt || !hash) return;
  const { data } = await db.from("skill_users").select("id,password_hash,force_password_change").eq("username_norm", username.toLowerCase()).maybeSingle();
  if (!data) {
    await db.from("skill_users").insert({ username, username_norm: username.toLowerCase(), password_salt: salt, password_hash: hash, role: "admin", force_password_change: true });
  } else if (data.force_password_change && data.password_hash !== hash) {
    await db.from("skill_users").update({ password_salt: salt, password_hash: hash }).eq("id", data.id);
    await db.from("skill_sessions").delete().eq("owner_id", data.id);
  }
}

async function createSession(ownerId: string) {
  const token = randomToken("ss_");
  const expires = new Date(Date.now() + SESSION_HOURS * 3600000).toISOString();
  const { error } = await db.from("skill_sessions").insert({ owner_id: ownerId, token_hash: await sha256(token), expires_at: expires });
  if (error) throw error;
  return token;
}

async function authFingerprint(request: Request, usernameNorm: string) {
  const address = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { ipHash: await sha256(address), usernameNorm };
}

async function tooManyAuthAttempts(request: Request, usernameNorm: string) {
  const key = await authFingerprint(request, usernameNorm);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from("skill_auth_events").select("id", { count: "exact", head: true }).eq("ip_hash", key.ipHash).eq("username_norm", key.usernameNorm).gte("created_at", since);
  return (count ?? 0) >= 8;
}

async function recordAuthFailure(request: Request, usernameNorm: string) {
  const key = await authFingerprint(request, usernameNorm);
  await db.from("skill_auth_events").insert({ ip_hash: key.ipHash, username_norm: key.usernameNorm });
}

async function clearAuthFailures(request: Request, usernameNorm: string) {
  const key = await authFingerprint(request, usernameNorm);
  await db.from("skill_auth_events").delete().eq("ip_hash", key.ipHash).eq("username_norm", key.usernameNorm);
}

async function authUser(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const raw = header.slice(7).trim();
  const digest = await sha256(raw);
  let ownerId = "";
  let mode: "session" | "token";
  if (raw.startsWith("ss_")) {
    mode = "session";
    const { data } = await db.from("skill_sessions").select("owner_id,expires_at").eq("token_hash", digest).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!data) return null;
    ownerId = data.owner_id;
  } else if (raw.startsWith("sd_")) {
    mode = "token";
    const { data } = await db.from("skill_access_tokens").select("id,owner_id").eq("token_hash", digest).is("revoked_at", null).maybeSingle();
    if (!data) return null;
    ownerId = data.owner_id;
    await db.from("skill_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  } else return null;
  const { data: user } = await db.from("skill_users").select("id,username,role,force_password_change,created_at").eq("id", ownerId).single();
  return user ? { user: publicUser(user), mode, raw } : null;
}

async function requireAuth(request: Request, mutation = false) {
  const auth = await authUser(request);
  if (!auth) return { response: json({ ok: false, error: "unauthorized" }, 401) };
  if (mutation && auth.user.force_password_change && apiPath(request) !== "/api/password") return { response: json({ ok: false, error: "password_change_required" }, 403) };
  return auth;
}

function frontmatter(markdown: string, key: string) {
  if (!markdown.startsWith("---")) return "";
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return "";
  const match = markdown.slice(3, end).match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
  return match?.[1]?.trim() ?? "";
}

async function inspectPackage(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_ZIP_BYTES) throw new Error("Skill 压缩包需小于 6 MB");
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error("文件不是有效的 ZIP 压缩包"); }
  const files = Object.values(zip.files).filter(file => !file.dir && !file.name.startsWith("__MACOSX/"));
  if (!files.length || files.length > MAX_FILES) throw new Error("Skill 文件数量需为 1-160 个");
  let total = 0;
  for (const file of files) {
    const parts = file.name.split("/");
    if (file.name.startsWith("/") || file.name.includes("\\") || parts.includes("..")) throw new Error("压缩包包含不安全的文件路径");
    const unix = typeof file.unixPermissions === "number" ? file.unixPermissions & 0o170000 : 0;
    if (unix === 0o120000) throw new Error("压缩包不能包含符号链接");
    const content = await file.async("uint8array");
    total += content.length;
    if (total > MAX_UNCOMPRESSED_BYTES) throw new Error("Skill 解压后需小于 16 MB");
  }
  const skillFiles = files.filter(file => file.name.split("/").at(-1) === "SKILL.md");
  if (skillFiles.length !== 1) throw new Error("每个压缩包必须且只能包含一个 SKILL.md");
  const path = skillFiles[0].name.split("/");
  if (path.length !== 2) throw new Error("SKILL.md 必须位于单一 Skill 根目录中");
  const root = path[0];
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(root)) throw new Error("Skill 根目录名需使用小写字母、数字和短横线");
  if (files.some(file => file.name.split("/")[0] !== root)) throw new Error("压缩包中只能包含一个 Skill 根目录");
  const markdown = await skillFiles[0].async("string");
  const name = frontmatter(markdown, "name");
  const description = frontmatter(markdown, "description");
  if (!name || !description) throw new Error("SKILL.md frontmatter 必须包含 name 和 description");
  if (name !== root) throw new Error("SKILL.md 的 name 必须与 Skill 根目录名一致");
  return { slug: root, name, description: description.slice(0, 600), file_count: files.length, sha256: await sha256(bytes) };
}

async function requestBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 9 * 1024 * 1024) throw new Error("request_too_large");
  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid_json");
  return body as Record<string, unknown>;
}

async function bundle(ownerId: string) {
  const { data: rows, error } = await db.from("private_skills").select("slug,object_path").eq("owner_id", ownerId).order("slug");
  if (error) throw error;
  if (!rows?.length) throw new Error("你的私人仓库中还没有 Skill");
  const target = new JSZip();
  for (const row of rows) {
    const { data, error: downloadError } = await db.storage.from(BUCKET).download(row.object_path);
    if (downloadError || !data) throw downloadError ?? new Error("package_missing");
    const source = await JSZip.loadAsync(await data.arrayBuffer());
    for (const file of Object.values(source.files)) if (!file.dir && !file.name.startsWith("__MACOSX/")) target.file(file.name, await file.async("uint8array"));
  }
  return { bytes: await target.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }), count: rows.length };
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  await ensureAdmin();
  const path = apiPath(request);
  try {
    if (request.method === "GET" && path === "/api/health") return json({ ok: true, service: "skills-desk-supabase", time: new Date().toISOString() });
    if (request.method === "POST" && path === "/api/register") {
      const body = await requestBody(request);
      const username = validateUsername(body.username);
      if (await tooManyAuthAttempts(request, username.toLowerCase())) return json({ ok: false, error: "too_many_attempts" }, 429);
      const password = validatePassword(body.password);
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const { data, error } = await db.from("skill_users").insert({ username, username_norm: username.toLowerCase(), password_salt: salt, password_hash: await passwordHash(password, salt) }).select("id,username,role,force_password_change,created_at").single();
      if (error?.code === "23505") {
        await recordAuthFailure(request, username.toLowerCase());
        return json({ ok: false, error: "username_exists" }, 409);
      }
      if (error || !data) throw error;
      await clearAuthFailures(request, username.toLowerCase());
      return json({ ok: true, user: publicUser(data), session_token: await createSession(data.id) }, 201);
    }
    if (request.method === "POST" && path === "/api/login") {
      const body = await requestBody(request);
      const username = String(body.username ?? "").trim().toLowerCase();
      if (await tooManyAuthAttempts(request, username)) return json({ ok: false, error: "too_many_attempts" }, 429);
      const password = String(body.password ?? "");
      const { data } = await db.from("skill_users").select("id,username,role,force_password_change,created_at,password_salt,password_hash").eq("username_norm", username).maybeSingle();
      const salt = data?.password_salt ?? "00000000000000000000000000000000";
      const supplied = await passwordHash(password, salt);
      if (!data || supplied !== data.password_hash) {
        await recordAuthFailure(request, username);
        return json({ ok: false, error: "invalid_credentials" }, 401);
      }
      await clearAuthFailures(request, username);
      return json({ ok: true, user: publicUser(data), session_token: await createSession(data.id) });
    }
    if (request.method === "GET" && path === "/api/auth") {
      const auth = await authUser(request);
      return json({ ok: true, authenticated: Boolean(auth), user: auth?.user ?? null, mode: auth?.mode ?? null });
    }
    if (request.method === "POST" && path === "/api/logout") {
      const auth = await authUser(request);
      if (auth?.mode === "session") await db.from("skill_sessions").delete().eq("token_hash", await sha256(auth.raw));
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "/api/password") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const body = await requestBody(request);
      const current = String(body.current_password ?? "");
      const next = validatePassword(body.new_password);
      const { data } = await db.from("skill_users").select("password_salt,password_hash").eq("id", auth.user.id).single();
      if (!data || await passwordHash(current, data.password_salt) !== data.password_hash) return json({ ok: false, error: "invalid_current_password" }, 401);
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      await db.from("skill_users").update({ password_salt: salt, password_hash: await passwordHash(next, salt), force_password_change: false }).eq("id", auth.user.id);
      return json({ ok: true });
    }
    if (request.method === "GET" && path === "/api/skills") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data, error } = await db.from("private_skills").select("id,slug,name,description,category,source,package_sha256,file_count,created_at,updated_at").eq("owner_id", auth.user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return json({ ok: true, skills: data ?? [] });
    }
    if (request.method === "POST" && path === "/api/skills") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const body = await requestBody(request);
      const category = String(body.category ?? "其他");
      if (!CATEGORIES.has(category)) return json({ ok: false, error: "无效的 Skill 分类" }, 400);
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(String(body.content_base64 ?? "")), char => char.charCodeAt(0)); } catch { return json({ ok: false, error: "invalid_base64" }, 400); }
      const meta = await inspectPackage(bytes);
      const objectPath = `${auth.user.id}/${meta.slug}.zip`;
      const { error: storageError } = await db.storage.from(BUCKET).upload(objectPath, bytes, { contentType: "application/zip", upsert: true });
      if (storageError) throw storageError;
      const now = new Date().toISOString();
      const { data: existing } = await db.from("private_skills").select("id,created_at").eq("owner_id", auth.user.id).eq("slug", meta.slug).maybeSingle();
      const record = { owner_id: auth.user.id, slug: meta.slug, name: meta.name, description: meta.description, category, object_path: objectPath, package_sha256: meta.sha256, file_count: meta.file_count, updated_at: now };
      const query = existing ? db.from("private_skills").update(record).eq("id", existing.id) : db.from("private_skills").insert(record);
      const { data, error } = await query.select("id,created_at").single();
      if (error || !data) throw error;
      return json({ ok: true, skill: { id: data.id, ...meta, category, created_at: data.created_at, updated_at: now } }, 201);
    }
    const contentMatch = path.match(/^\/api\/skills\/([a-f0-9-]+)\/content$/);
    if (request.method === "GET" && contentMatch) {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data: row } = await db.from("private_skills").select("slug,object_path").eq("id", contentMatch[1]).eq("owner_id", auth.user.id).maybeSingle();
      if (!row) return json({ ok: false, error: "skill_not_found" }, 404);
      const { data, error } = await db.storage.from(BUCKET).download(row.object_path);
      if (error || !data) throw error;
      return binary(new Uint8Array(await data.arrayBuffer()), `${row.slug}.zip`);
    }
    const skillMatch = path.match(/^\/api\/skills\/([a-f0-9-]+)$/);
    if (request.method === "DELETE" && skillMatch) {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const { data: row } = await db.from("private_skills").select("object_path").eq("id", skillMatch[1]).eq("owner_id", auth.user.id).maybeSingle();
      if (!row) return json({ ok: false, error: "skill_not_found" }, 404);
      await db.storage.from(BUCKET).remove([row.object_path]);
      await db.from("private_skills").delete().eq("id", skillMatch[1]).eq("owner_id", auth.user.id);
      return json({ ok: true });
    }
    if (request.method === "GET" && path === "/api/bundle") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const result = await bundle(auth.user.id);
      return binary(result.bytes, `${auth.user.username}-skills-${result.count}.zip`);
    }
    if (request.method === "GET" && path === "/api/tokens") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data, error } = await db.from("skill_access_tokens").select("id,label,created_at,last_used_at,revoked_at").eq("owner_id", auth.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ ok: true, tokens: data ?? [] });
    }
    if (request.method === "POST" && path === "/api/tokens") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const body = await requestBody(request);
      const label = String(body.label ?? "Agent token").trim().slice(0, 80) || "Agent token";
      const token = randomToken("sd_");
      const { data, error } = await db.from("skill_access_tokens").insert({ owner_id: auth.user.id, label, token_hash: await sha256(token) }).select("id,label").single();
      if (error || !data) throw error;
      return json({ ok: true, token, id: data.id, label: data.label }, 201);
    }
    const tokenMatch = path.match(/^\/api\/tokens\/([a-f0-9-]+)$/);
    if (request.method === "DELETE" && tokenMatch) {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const { data } = await db.from("skill_access_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", tokenMatch[1]).eq("owner_id", auth.user.id).is("revoked_at", null).select("id").maybeSingle();
      return data ? json({ ok: true }) : json({ ok: false, error: "token_not_found" }, 404);
    }
    return json({ ok: false, error: "not_found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "server_error";
    const status = message === "request_too_large" ? 413 : message.includes("Skill") || message.includes("压缩包") || message.includes("SKILL.md") ? 400 : 500;
    console.error(error);
    return json({ ok: false, error: status === 500 ? "server_error" : message }, status);
  }
});
