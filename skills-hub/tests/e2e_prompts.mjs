const base = process.env.SKILLS_API_URL;
const username = process.env.E2E_USERNAME;

if (!base || !username) throw new Error("SKILLS_API_URL and E2E_USERNAME are required");

async function call(path, method = "GET", body, token = "") {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("json") ? await response.json() : await response.arrayBuffer();
  if (!response.ok) throw new Error(`${path} ${response.status} ${data.error || ""}`);
  return data;
}

const registered = await call("/api/register", "POST", { username, password: "TestFlowPassword99" });
const token = registered.session_token;
const analyzed = await call("/api/prompts/analyze", "POST", {
  hint: "整理 AI 公司融资信息",
  body: "# 融资信息整理\n请根据公开材料整理公司、轮次、金额、投资方和创始人。",
}, token);
const saved = await call("/api/prompts", "POST", { ...analyzed.proposal, body: analyzed.body }, token);
const updated = await call(`/api/prompts/${saved.prompt.id}`, "PUT", { ...saved.prompt, body:`${saved.prompt.body}\n\n请标注无法核实的信息。` }, token);
const listed = await call("/api/prompts", "GET", undefined, token);
const downloaded = await call(`/api/prompts/${updated.prompt.id}/download`, "GET", undefined, token);
const bundle = await call("/api/prompts/bundle", "GET", undefined, token);
const shared = await call("/api/shares", "POST", { label:"E2E read-only", expires_days:1 }, token);
const sharedRepo = await call("/api/share/open", "POST", { code:shared.code });
const sharedDownload = await call(`/api/share/prompts/${updated.prompt.id}/download`, "GET", undefined, shared.code);
const denied = await fetch(`${base}/api/prompts/${updated.prompt.id}`, { method:"PUT", headers:{"Content-Type":"application/json",Authorization:`Bearer ${shared.code}`}, body:JSON.stringify(updated.prompt) });
await call(`/api/shares/${shared.share.id}`, "DELETE", {}, token);
const revoked = await fetch(`${base}/api/share`, { headers:{Authorization:`Bearer ${shared.code}`} });
await call(`/api/prompts/${updated.prompt.id}`, "DELETE", {}, token);

if (analyzed.proposal.category !== "商业尽调") throw new Error(`unexpected category: ${analyzed.proposal.category}`);
if (updated.prompt.version !== 2 || listed.prompts.length !== 1 || listed.prompts[0].version !== 2 || downloaded.byteLength < 100 || bundle.byteLength < 100) throw new Error("Prompt version round-trip validation failed");
if (sharedRepo.prompts.length !== 1 || sharedRepo.prompts[0].version !== 2 || sharedDownload.byteLength < 100 || denied.status !== 401 || revoked.status !== 401) throw new Error("Share-code permission validation failed");

console.log(JSON.stringify({
  prompt_category: analyzed.proposal.category,
  prompt_count: listed.prompts.length,
  prompt_version: updated.prompt.version,
  markdown_bytes: downloaded.byteLength,
  bundle_bytes: bundle.byteLength,
  shared_prompt_count: sharedRepo.prompts.length,
  shared_mutation_status: denied.status,
  revoked_access_status: revoked.status,
}));
