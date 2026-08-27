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
const MAX_PROMPT_CHARS = 100000;
const CATEGORIES = new Set(["项目发现", "BP 初筛", "行业研究", "商业尽调", "财务分析", "法务合规", "IC 材料", "投后管理", "募资与 LP", "基金运营", "人才与关系", "会议与知识", "数据与表格", "内容交付", "自动化与工具", "其他"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

type User = { id: string; username: string; role: string; force_password_change: boolean; created_at: string };

class HttpError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "HttpError";
  }
}

function json(payload: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...cors, ...extra, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}

function binary(body: Uint8Array, filename: string) {
  return new Response(arrayBuffer(body), { headers: { ...cors, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9_.-]/g, "-")}"`, "Cache-Control": "no-store" } });
}

function textFile(body: string, filename: string) {
  return new Response(body, { headers: { ...cors, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9_.-]/g, "-")}"`, "Cache-Control": "no-store" } });
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
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/.test(value)) throw new HttpError("用户名需为 3-32 位字母、数字、点、下划线或短横线");
  return value;
}

function validatePassword(input: unknown, temporary = false) {
  const value = String(input ?? "");
  const minimum = temporary ? 8 : 10;
  if (value.length < minimum || value.length > 128) throw new HttpError(`密码长度需为 ${minimum}-128 位`);
  if (!temporary && (!/[A-Za-z]/.test(value) || !/[^A-Za-z]/.test(value))) throw new HttpError("密码需同时包含字母和数字或符号");
  return value;
}

function cleanText(input: unknown, maximum: number, label: string) {
  const value = String(input ?? "").trim();
  if (!value || value.length > maximum) throw new HttpError(`${label}不能为空且不能超过 ${maximum} 字`);
  return value;
}

function stringList(input: unknown, maximum = 12) {
  const source = Array.isArray(input) ? input : String(input ?? "").split(/[,，\n]/);
  return [...new Set(source.map(item => String(item).trim()).filter(Boolean))].slice(0, maximum);
}

function promptBody(input: unknown) {
  let value = String(input ?? "").replaceAll("\r\n", "\n");
  if (value.startsWith("---\n")) {
    const end = value.indexOf("\n---", 4);
    if (end >= 0) value = value.slice(end + 4).replace(/^\s+/, "");
  }
  if (value.trim().length < 12 || value.length > MAX_PROMPT_CHARS) throw new HttpError("Prompt 内容需为 12-100000 字");
  return value;
}

function suggestCategory(value: string) {
  const rules: Array<[string, RegExp]> = [
    ["项目发现", /项目发现|product hunt|kickstarter|github|开源项目|产品跟踪/i],
    ["BP 初筛", /商业计划|bp|pitch deck|项目初筛/i],
    ["行业研究", /行业研究|research|市场研究|竞品|赛道|大事件|新闻/i],
    ["商业尽调", /尽调|due diligence|公司调研|company profil|公司.{0,12}融资|融资.{0,12}公司|轮次|投资方/i],
    ["财务分析", /财务|估值|现金流|利润|收入|financial/i],
    ["法务合规", /法务|合规|合同|条款|legal/i],
    ["IC 材料", /ic memo|投委会|投资建议|决策材料/i],
    ["投后管理", /投后|portfolio|经营分析/i],
    ["募资与 LP", /募资|lp|limited partner/i],
    ["基金运营", /基金运营|周更|tracking|sop|运营/i],
    ["人才与关系", /人才|人物|创始人|researcher|mapping|人事|离职|入职/i],
    ["会议与知识", /会议|纪要|逐字稿|访谈|播客|知识库/i],
    ["数据与表格", /数据库|表格|excel|sheet|数据录入/i],
    ["内容交付", /写作|文章|润色|摘要|summary|周报/i],
    ["自动化与工具", /自动化|agent|workflow|工具|脚本/i],
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] ?? "其他";
}

function shortSuggestion(value: string, fallback: string, maximum: number) {
  const cleaned = value.replace(/^#+\s*/gm, "").replace(/[`*_>#]/g, "").replace(/\s+/g, " ").trim();
  return (cleaned.split(/[。！？.!?\n]/).find(part => part.trim().length >= 4)?.trim() || fallback).slice(0, maximum);
}

async function promptProposal(body: string, hint: string) {
  const heading = body.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() ?? "";
  const category = suggestCategory(`${hint}\n${heading}\n${body.slice(0, 5000)}`);
  const name = shortSuggestion(heading || hint, `${category} Prompt`, 60);
  const digest = await sha256(`${name}\n${body}`);
  const categoryTasks: Record<string, string[]> = {
    "项目发现":["project-discovery"], "BP 初筛":["screening"], "行业研究":["research"], "商业尽调":["due-diligence"],
    "财务分析":["financial-analysis"], "法务合规":["legal"], "IC 材料":["investment-memo"], "投后管理":["portfolio-management"],
    "募资与 LP":["fundraising"], "基金运营":["investment-operations"], "人才与关系":["people-mapping"], "会议与知识":["meeting-minutes"],
    "数据与表格":["data"], "内容交付":["writing"], "自动化与工具":["automation"], "其他":["general"]
  };
  return {
    slug: `prompt-${digest.slice(0, 12)}`,
    name,
    description: shortSuggestion(hint || body, `用于${name}`, 180),
    category,
    task_types: categoryTasks[category] ?? ["general"],
    triggers: stringList([name, category]),
    inputs: ["用户提供的任务材料"],
    outputs: ["Prompt 指定的结果"],
    language: /[\u3400-\u9fff]/.test(body) ? "zh" : "en",
  };
}

function yamlList(values: unknown) {
  return `[${stringList(values).map(value => JSON.stringify(value)).join(", ")}]`;
}

function promptMarkdown(row: Record<string, unknown>) {
  return `---\nid: ${row.slug}\nname: ${JSON.stringify(row.name)}\ndescription: ${JSON.stringify(row.description)}\ntask_types: ${yamlList(row.task_types)}\ntriggers: ${yamlList(row.triggers)}\ninputs: ${yamlList(row.inputs)}\noutputs: ${yamlList(row.outputs)}\nlanguage: ${row.language}\nversion: ${row.version}\nstatus: ${row.status}\nrequires_confirmation: true\ntrigger_confirmed: true\n---\n\n${row.body}`;
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
  return { slug: root, name, description: description.slice(0, 600), file_count: files.length, sha256: await sha256(bytes), skill_markdown: markdown };
}

async function requestBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 9 * 1024 * 1024) throw new HttpError("request_too_large", 413);
  let body: unknown;
  try { body = await request.json(); } catch { throw new HttpError("invalid_json"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError("invalid_json");
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
      const { error } = await db.from("skill_users").update({ password_salt: salt, password_hash: await passwordHash(next, salt), force_password_change: false }).eq("id", auth.user.id);
      if (error) throw error;
      return json({ ok: true });
    }
    if (request.method === "GET" && path === "/api/skills") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data, error } = await db.from("private_skills").select("id,slug,name,title,description,category,source,package_sha256,file_count,created_at,updated_at").eq("owner_id", auth.user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return json({ ok: true, skills: data ?? [] });
    }
    if (request.method === "POST" && path === "/api/skills/analyze") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const body = await requestBody(request);
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(String(body.content_base64 ?? "")), char => char.charCodeAt(0)); } catch { return json({ ok: false, error: "invalid_base64" }, 400); }
      const meta = await inspectPackage(bytes);
      const hint = String(body.hint ?? "").trim().slice(0, 1000);
      const category = suggestCategory(`${hint}\n${meta.name}\n${meta.description}`);
      const promptLike = meta.file_count <= 4 && /prompt|提示词|文案模板|写作模板/i.test(`${hint}\n${meta.name}\n${meta.description}`);
      const { data: similar } = await db.from("private_skills").select("id,slug,title,name").eq("owner_id", auth.user.id).eq("slug", meta.slug).maybeSingle();
      return json({ ok: true, proposal: { ...meta, title: shortSuggestion(hint, meta.name, 80), description: meta.description, category, install_note: `安装后目录名为 ${meta.slug}，Agent 会从 SKILL.md 读取使用说明。`, alternative:promptLike ? { kind:"prompt", reason:"内容以可复用指令为主，也可以改存为更方便复制的 Prompt。", body:meta.skill_markdown } : null }, similar });
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
      const title = cleanText(body.title ?? meta.name, 80, "Skill 名称");
      const description = cleanText(body.description ?? meta.description, 600, "Skill 说明");
      const objectPath = `${auth.user.id}/${meta.slug}.zip`;
      const { error: storageError } = await db.storage.from(BUCKET).upload(objectPath, bytes, { contentType: "application/zip", upsert: true });
      if (storageError) throw storageError;
      const now = new Date().toISOString();
      const { data: existing } = await db.from("private_skills").select("id,created_at").eq("owner_id", auth.user.id).eq("slug", meta.slug).maybeSingle();
      const record = { owner_id: auth.user.id, slug: meta.slug, name: meta.name, title, description, category, object_path: objectPath, package_sha256: meta.sha256, file_count: meta.file_count, updated_at: now };
      const query = existing ? db.from("private_skills").update(record).eq("id", existing.id) : db.from("private_skills").insert(record);
      const { data, error } = await query.select("id,created_at").single();
      if (error || !data) throw error;
      return json({ ok: true, skill: { id: data.id, ...meta, category, created_at: data.created_at, updated_at: now } }, 201);
    }
    if (request.method === "GET" && path === "/api/prompts") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data, error } = await db.from("private_prompts").select("id,slug,name,description,category,body,task_types,triggers,inputs,outputs,language,version,status,created_at,updated_at").eq("owner_id", auth.user.id).neq("status", "archived").order("updated_at", { ascending: false });
      if (error) throw error;
      return json({ ok: true, prompts: data ?? [] });
    }
    if (request.method === "POST" && path === "/api/prompts/analyze") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const input = await requestBody(request);
      const body = promptBody(input.body);
      const proposal = await promptProposal(body, String(input.hint ?? "").trim().slice(0, 1000));
      const { data: similar } = await db.from("private_prompts").select("id,slug,name,description,category").eq("owner_id", auth.user.id).eq("slug", proposal.slug).limit(3);
      return json({ ok: true, body, proposal, similar: similar ?? [] });
    }
    if (request.method === "POST" && path === "/api/prompts") {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const input = await requestBody(request);
      const body = promptBody(input.body);
      const name = cleanText(input.name, 80, "Prompt 名称");
      const description = cleanText(input.description, 600, "Prompt 说明");
      const category = String(input.category ?? "其他");
      if (!CATEGORIES.has(category)) throw new HttpError("无效的 Prompt 分类");
      const proposed = await promptProposal(body, name);
      const slug = /^[a-z0-9][a-z0-9-]{2,79}$/.test(String(input.slug ?? "")) ? String(input.slug) : proposed.slug;
      const record = { owner_id: auth.user.id, slug, name, description, category, body, task_types:stringList(input.task_types), triggers:stringList(input.triggers), inputs:stringList(input.inputs), outputs:stringList(input.outputs), language:String(input.language ?? proposed.language).slice(0, 8), version:Math.max(1, Number(input.version) || 1), status:"active", updated_at:new Date().toISOString() };
      const { data, error } = await db.from("private_prompts").insert(record).select("id,slug,name,description,category,body,task_types,triggers,inputs,outputs,language,version,status,created_at,updated_at").single();
      if (error?.code === "23505") return json({ ok:false, error:"prompt_exists" }, 409);
      if (error || !data) throw error;
      return json({ ok:true, prompt:data }, 201);
    }
    if (request.method === "GET" && path === "/api/prompts/bundle") {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data, error } = await db.from("private_prompts").select("slug,name,description,body,task_types,triggers,inputs,outputs,language,version,status").eq("owner_id", auth.user.id).neq("status", "archived").order("slug");
      if (error) throw error;
      if (!data?.length) throw new HttpError("你的私人仓库中还没有 Prompt", 404);
      const zip = new JSZip();
      for (const row of data) zip.file(`${row.slug}.md`, promptMarkdown(row));
      return binary(await zip.generateAsync({ type:"uint8array", compression:"DEFLATE" }), `${auth.user.username}-prompts-${data.length}.zip`);
    }
    const promptDownloadMatch = path.match(/^\/api\/prompts\/([a-f0-9-]+)\/download$/);
    if (request.method === "GET" && promptDownloadMatch) {
      const auth = await requireAuth(request);
      if ("response" in auth) return auth.response;
      const { data } = await db.from("private_prompts").select("slug,name,description,body,task_types,triggers,inputs,outputs,language,version,status").eq("id", promptDownloadMatch[1]).eq("owner_id", auth.user.id).maybeSingle();
      return data ? textFile(promptMarkdown(data), `${data.slug}.md`) : json({ ok:false, error:"prompt_not_found" }, 404);
    }
    const promptMatch = path.match(/^\/api\/prompts\/([a-f0-9-]+)$/);
    if (request.method === "DELETE" && promptMatch) {
      const auth = await requireAuth(request, true);
      if ("response" in auth) return auth.response;
      const { data } = await db.from("private_prompts").delete().eq("id", promptMatch[1]).eq("owner_id", auth.user.id).select("id").maybeSingle();
      return data ? json({ ok:true }) : json({ ok:false, error:"prompt_not_found" }, 404);
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
    const status = error instanceof HttpError ? error.status : message === "request_too_large" ? 413 : message.includes("Skill") || message.includes("压缩包") || message.includes("SKILL.md") ? 400 : 500;
    console.error(error);
    return json({ ok: false, error: status === 500 ? "server_error" : message }, status);
  }
});
