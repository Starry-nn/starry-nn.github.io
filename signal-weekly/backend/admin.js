const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const safeUrl = value => /^https?:\/\//i.test(String(value || "")) ? String(value) : "#";
const formatTime = value => value ? new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:"Asia/Shanghai"}).format(new Date(value)) : "-";
let polling = null;
let sources = [];
let editingSourceId = null;

function showLogin(message = "") {
  clearTimeout(polling);
  $("#adminApp").hidden = true;
  $("#loginView").hidden = false;
  $("#loginMessage").textContent = message;
}

function showAdmin() {
  $("#loginView").hidden = true;
  $("#adminApp").hidden = false;
}

async function api(path, options = {}) {
  const response = await fetch(path, {cache:"no-store", credentials:"same-origin", ...options});
  let payload = {};
  try { payload = await response.json(); } catch (_) { payload = {error:`HTTP ${response.status}`}; }
  if (response.status === 401 && path !== "/api/login") showLogin("登录已过期，请重新登录。");
  if (!response.ok) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

function actionOptions(method = "POST", body = {}) {
  return {method, headers:{"Content-Type":"application/json","X-Signal-Action":"maintenance"}, body:JSON.stringify(body)};
}

function renderJob(job = {}) {
  const running = job.status === "running";
  document.querySelectorAll("[data-job]").forEach(button => { button.disabled = running; });
  $("#statusMessage").textContent = running ? `正在运行 ${job.name}，开始于 ${formatTime(job.started_at)}` : `最近任务：${job.name || "无"} / ${job.status || "idle"}`;
  $("#jobLog").textContent = [job.stdout, job.stderr].filter(Boolean).join("\n") || "暂无运行记录";
  clearTimeout(polling);
  if (running) polling = setTimeout(refresh, 1600);
}

function renderPublish(payload = {}) {
  const published = payload.published || {};
  const failed = published.status === "failed";
  const current = !payload.needs_publish && !failed;
  $("#publishState").textContent = failed ? "发布失败" : current ? "线上已同步" : published.commit ? "有内容待发布" : "尚未发布";
  const details = [];
  if (published.published_at) details.push(`最近发布 ${formatTime(published.published_at)}`);
  if (published.commit) details.push(`提交 ${published.commit.slice(0, 8)}`);
  if (published.pages_status) details.push(`Pages ${published.pages_status}`);
  if (published.error) details.push(published.error);
  $("#publishMessage").textContent = details.join(" · ") || "本地数据生成后，可发布到 GitHub Pages。";
  $("#publishState").className = failed ? "publish-failed" : current ? "publish-current" : "publish-pending";
  $("#autoPublishToggle").checked = payload.settings?.auto_publish === true;
  if (published.url) $("#liveSite").href = safeUrl(published.url);
}

function sourceMatches(source, query) {
  const haystack = [source.id, source.name, source.url, source.type, source.region, ...(source.topics || [])].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function renderSources() {
  const filtered = sources.filter(source => sourceMatches(source, $("#sourceSearch").value));
  $("#sourceRows").innerHTML = filtered.map(source => {
    const count = Array.isArray(source.accounts) ? `${source.accounts.length} 个账号` : (source.run?.count || 0);
    const enabled = source.enabled !== false;
    return `<tr class="${enabled ? "" : "source-disabled"}"><td><b>${escapeHtml(source.name)}</b><small>${escapeHtml(source.id)}</small><a href="${escapeHtml(safeUrl(source.url))}" target="_blank" rel="noopener">${escapeHtml(source.url)}</a></td><td>${escapeHtml(source.type)}<small>${source.region === "cn" ? "国内" : "海外"}</small></td><td>${escapeHtml(source.tier)}</td><td><span class="state ${enabled ? escapeHtml(source.run?.status) : "disabled"}">${enabled ? escapeHtml(source.run?.status || "unknown") : "disabled"}</span></td><td>${escapeHtml(count)}</td><td><div class="row-actions"><button type="button" data-source-action="test" data-id="${escapeHtml(source.id)}" ${enabled ? "" : "disabled"}>试抓</button><button type="button" data-source-action="edit" data-id="${escapeHtml(source.id)}">编辑</button><button type="button" data-source-action="toggle" data-id="${escapeHtml(source.id)}">${enabled ? "停用" : "启用"}</button><button type="button" class="danger" data-source-action="delete" data-id="${escapeHtml(source.id)}">删除</button></div></td></tr>`;
  }).join("") || `<tr><td colspan="6">没有匹配的来源。</td></tr>`;
}

async function refresh() {
  try {
    const [statusPayload, sourcePayload, candidatePayload, publishPayload] = await Promise.all([api("/api/status"),api("/api/sources"),api("/api/candidates"),api("/api/publish")]);
    const status = statusPayload.pipeline || {};
    sources = sourcePayload.sources || [];
    $("#candidateCount").textContent = String(candidatePayload.items?.length || 0);
    $("#sourceCount").textContent = String(sourcePayload.count || 0);
    $("#errorCount").textContent = String(status.sources_error || 0);
    $("#updatedAt").textContent = formatTime(status.generated_at);
    renderJob(statusPayload.job); renderPublish(publishPayload); renderSources();
    $("#candidateRows").innerHTML = (candidatePayload.items || []).map(item => `<article class="candidate"><div class="candidate-meta">${escapeHtml(item.source)}<br>${escapeHtml(item.date)}</div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p></div><div><strong>${escapeHtml(item.score)}</strong><br><a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">原始来源 ↗</a></div></article>`).join("") || "<p>候选池为空。</p>";
  } catch (error) {
    if ($("#adminApp").hidden) return;
    $("#statusMessage").textContent = `读取失败：${error.message}`;
  }
}

async function runJob(name) {
  const prompts = {collect:"运行直接采集？失败来源会被记录，但不会删除历史内容。",wechat:"检查自建 WeRSS 是否在线，并对比公众号订阅？",ingest:"导入 data/inbox.json 中的浏览器候选？",publish:"发布当前公开页面到 GitHub？只会上传白名单中的 5 个静态文件。"};
  if (!window.confirm(prompts[name])) return;
  try { const payload = await api(`/api/run/${name}`, actionOptions()); renderJob(payload.job); refresh(); }
  catch (error) { window.alert(`任务未启动：${error.message}`); }
}

async function saveAutoPublish() {
  const toggle = $("#autoPublishToggle"); toggle.disabled = true;
  try {
    const payload = await api("/api/publish/settings", actionOptions("POST", {auto_publish:toggle.checked}));
    toggle.checked = payload.settings?.auto_publish === true;
    $("#publishMessage").textContent = toggle.checked ? "已开启：采集或导入成功后自动同步线上。" : "已关闭自动发布，可继续使用手动发布。";
  } catch (error) { toggle.checked = !toggle.checked; window.alert(`设置未保存：${error.message}`); }
  finally { toggle.disabled = false; }
}

function openSourceDialog(source = null) {
  editingSourceId = source?.id || null;
  const form = $("#sourceForm"); form.reset(); form.elements.id.disabled = Boolean(source);
  $("#sourceDialogTitle").textContent = source ? "编辑来源" : "新增来源"; $("#sourceMessage").textContent = "";
  if (source) {
    for (const field of ["id","name","url","type","region","tier","note"]) if (form.elements[field]) form.elements[field].value = source[field] || "";
    form.elements.topics.value = (source.topics || []).join(", "); form.elements.enabled.checked = source.enabled !== false;
  } else { form.elements.enabled.checked = true; }
  $("#sourceDialog").showModal();
}

function sourceFormPayload() {
  const form = $("#sourceForm");
  return {id:editingSourceId || form.elements.id.value.trim(), name:form.elements.name.value.trim(), url:form.elements.url.value.trim(), type:form.elements.type.value, region:form.elements.region.value, tier:form.elements.tier.value, topics:form.elements.topics.value.split(",").map(value => value.trim()).filter(Boolean), note:form.elements.note.value.trim(), enabled:form.elements.enabled.checked};
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i], next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value)) rows.push(row);
      row = []; continue;
    }
    cell += char;
  }
  row.push(cell.trim()); if (row.some(value => value)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows.shift().map(value => value.toLowerCase().replace(/[\s-]+/g, "_"));
  return rows.map(values => {
    const item = {}; headers.forEach((header, index) => { item[header] = values[index] || ""; });
    item.topics = String(item.topics || "").split(/[|;，]/).map(value => value.trim()).filter(Boolean);
    if (item.enabled !== "") item.enabled = !["false", "0", "no", "停用", "禁用"].includes(String(item.enabled).toLowerCase());
    return item;
  });
}

async function importSourcesFile(event) {
  const file = event.target.files?.[0]; event.target.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    let imported = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
    if (Array.isArray(imported)) imported = {sources: imported};
    if (!imported || !Array.isArray(imported.sources) || !imported.sources.length) throw new Error("文件中没有 sources 列表");
    if (!window.confirm(`准备导入 ${imported.sources.length} 个来源。已有相同 ID 会更新，其他来源保留。继续吗？`)) return;
    const result = await api("/api/sources/import", actionOptions("POST", imported));
    window.alert(`导入完成：新增 ${result.created} 个，更新 ${result.updated} 个，当前共 ${result.total} 个来源。`);
    await refresh();
  } catch (error) { window.alert(`导入失败：${error.message}`); }
}

async function saveSource(event) {
  event.preventDefault(); const payload = sourceFormPayload(); $("#sourceMessage").textContent = "正在保存…";
  try { await api(editingSourceId ? `/api/sources/${encodeURIComponent(editingSourceId)}` : "/api/sources", actionOptions(editingSourceId ? "PUT" : "POST", payload)); $("#sourceDialog").close(); await refresh(); }
  catch (error) { $("#sourceMessage").textContent = `保存失败：${error.message}`; }
}

async function sourceAction(event) {
  const button = event.target.closest("[data-source-action]"); if (!button) return;
  const source = sources.find(item => item.id === button.dataset.id); if (!source) return;
  const action = button.dataset.sourceAction;
  if (action === "edit") return openSourceDialog(source);
  if (action === "test") { try { const payload = await api(`/api/run/source/${encodeURIComponent(source.id)}`, actionOptions()); renderJob(payload.job); } catch (error) { window.alert(`试抓未启动：${error.message}`); } return; }
  if (action === "toggle") {
    const next = source.enabled === false; if (!window.confirm(`${next ? "启用" : "停用"}「${source.name}」？`)) return;
    try { await api(`/api/sources/${encodeURIComponent(source.id)}`, actionOptions("PUT", {...source, enabled:next})); await refresh(); } catch (error) { window.alert(`修改失败：${error.message}`); } return;
  }
  if (action === "delete") {
    if (!window.confirm(`删除「${source.name}」？建议优先停用；删除后可从本地备份恢复。`)) return;
    try { await api(`/api/sources/${encodeURIComponent(source.id)}`, actionOptions("DELETE")); }
    catch (error) {
      if (error.payload?.error !== "source_has_candidates" || !window.confirm(`仍有 ${error.payload.references} 条候选引用该来源。确定强制删除来源登记吗？候选不会被自动删除。`)) return;
      await api(`/api/sources/${encodeURIComponent(source.id)}?force=true`, actionOptions("DELETE"));
    }
    await refresh();
  }
}

async function login(event) {
  event.preventDefault(); const form = event.currentTarget; $("#loginMessage").textContent = "正在登录…";
  try { await api("/api/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:form.elements.username.value,password:form.elements.password.value})}); form.elements.password.value=""; showAdmin(); await refresh(); }
  catch (error) { $("#loginMessage").textContent = error.message === "too_many_attempts" ? "尝试次数过多，请十分钟后再试。" : "账号或密码不正确。"; }
}

async function boot() {
  try { const auth = await api("/api/auth"); if (auth.authenticated || !auth.configured) { showAdmin(); await refresh(); } else showLogin(); }
  catch (_) { showLogin("无法连接维护服务。"); }
}

$("#loginForm").addEventListener("submit", login);
$("#logoutButton").addEventListener("click", async () => { await api("/api/logout", {method:"POST"}); showLogin("已安全退出。"); });
$("#refreshButton").addEventListener("click", refresh);
document.querySelectorAll("[data-job]").forEach(button => button.addEventListener("click",()=>runJob(button.dataset.job)));
$("#autoPublishToggle").addEventListener("change",saveAutoPublish);
$("#sourceSearch").addEventListener("input",renderSources);
$("#sourceRows").addEventListener("click",sourceAction);
$("#addSource").addEventListener("click",()=>openSourceDialog());
$("#importSources").addEventListener("click",()=>$("#sourceFile").click());
$("#sourceFile").addEventListener("change",importSourcesFile);
$("#exportSources").addEventListener("click",()=>window.location.assign("/api/sources/export"));
$("#sourceForm").addEventListener("submit",saveSource);
$("#closeSourceDialog").addEventListener("click",()=>$("#sourceDialog").close());
$("#cancelSource").addEventListener("click",()=>$("#sourceDialog").close());
boot();
