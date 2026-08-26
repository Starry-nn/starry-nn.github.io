const categories = ["全部", "项目发现", "BP 初筛", "行业研究", "商业尽调", "财务分析", "法务合规", "IC 材料", "投后管理", "募资与 LP", "基金运营", "人才与关系", "会议与知识", "数据与表格", "内容交付", "自动化与工具", "其他"];
const uploadCategories = categories.filter(item => item !== "全部");
const tasks = [
  ["找项目", "项目发现"], ["拆 BP", "BP 初筛"], ["做行研", "行业研究"], ["做尽调", "商业尽调"],
  ["看财务", "财务分析"], ["写 IC", "IC 材料"], ["管投后", "投后管理"], ["做基金运营", "基金运营"]
];

const supabaseConfig = window.SKILLS_DESK_SUPABASE || {url:"", publishableKey:""};
const usesSupabase = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
const state = { publicSkills: [], privateSkills: [], user: null, csrf: null, sessionToken: localStorage.getItem("skills-desk-session") || "", query: "", provider: "全部来源", category: "全部", authMode: "login" };
const el = id => document.getElementById(id);
const authDialog = el("authDialog");
const uploadDialog = el("uploadDialog");
const tokenDialog = el("tokenDialog");
const passwordDialog = el("passwordDialog");
let toastTimer;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"}[char]));
}

function normalize(value) {
  return String(value ?? "").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  el("toast").textContent = message;
  el("toast").classList.add("visible");
  toastTimer = window.setTimeout(() => el("toast").classList.remove("visible"), 2300);
}

async function copyText(value, message = "已复制") {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  showToast(message);
}

function apiUrl(path) {
  if (!usesSupabase) return path;
  const clean = path.replace(/^\./, "");
  return `${supabaseConfig.url.replace(/\/$/, "")}/functions/v1/skills-api${clean}`;
}

function apiHeaders(extra = {}) {
  const headers = {"Content-Type":"application/json", ...extra};
  if (usesSupabase) headers.apikey = supabaseConfig.publishableKey;
  if (state.sessionToken) headers.Authorization = `Bearer ${state.sessionToken}`;
  return headers;
}

async function api(path, options = {}) {
  const headers = apiHeaders(options.headers || {});
  if (options.mutation && state.csrf) headers["X-CSRF-Token"] = state.csrf;
  const response = await fetch(apiUrl(path), {...options, headers, credentials: usesSupabase ? "omit" : "same-origin"});
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function publicMatches(skill) {
  const providerMatch = state.provider === "全部来源" || skill.provider === state.provider;
  const categoryMatch = state.category === "全部" || skill.category === state.category;
  const words = normalize(state.query).split(" ").filter(Boolean);
  const haystack = normalize([skill.title, skill.name, skill.provider, skill.category, skill.description, skill.when].join(" "));
  return providerMatch && categoryMatch && words.every(word => haystack.includes(word));
}

function skillCard(skill, isPrivate = false) {
  if (isPrivate) {
    return `<article class="skill-card private-card">
      <div class="skill-meta"><span class="provider">${escapeHtml(skill.category)}</span><span class="skill-type">私人</span></div>
      <div><h3>${escapeHtml(skill.name)}</h3><span class="skill-name">${escapeHtml(skill.slug)}</span></div>
      <div><p class="skill-description">${escapeHtml(skill.description)}</p><p class="skill-when"><strong>包信息</strong>${skill.file_count} 个文件，SHA-256 ${escapeHtml(skill.package_sha256.slice(0, 12))}</p></div>
      <div class="skill-actions"><button class="text-button" type="button" data-download-skill="${escapeHtml(skill.id)}" data-skill-slug="${escapeHtml(skill.slug)}">下载 ZIP</button><button class="text-button" type="button" data-delete-skill="${escapeHtml(skill.id)}">删除</button></div>
    </article>`;
  }
  return `<article class="skill-card">
    <div class="skill-meta"><span class="provider">${escapeHtml(skill.provider)}</span><span class="skill-type">${escapeHtml(skill.type)}</span></div>
    <div><h3>${escapeHtml(skill.title)}</h3><span class="skill-name">${escapeHtml(skill.name)}</span></div>
    <div><p class="skill-description">${escapeHtml(skill.description)}</p><p class="skill-when"><strong>什么时候用</strong>${escapeHtml(skill.when)}</p></div>
    <div class="skill-actions"><a href="${escapeHtml(skill.source_url)}" target="_blank" rel="noopener">查看来源</a><button class="text-button" type="button" data-copy-prompt="${escapeHtml(skill.id)}">复制调用语</button></div>
  </article>`;
}

function renderTasks() {
  el("taskGrid").innerHTML = tasks.map(([title, category]) => {
    const count = state.publicSkills.filter(skill => skill.category === category).length;
    return `<button class="task-button" type="button" data-task="${escapeHtml(category)}"><strong>${escapeHtml(title)}</strong><span>${count} 个相关 Skills</span></button>`;
  }).join("");
}

function renderFilters() {
  const providers = ["全部来源", ...new Set(state.publicSkills.map(skill => skill.provider))];
  el("providerFilters").innerHTML = providers.map(provider => `<button class="filter-button${state.provider === provider ? " active" : ""}" type="button" data-provider="${escapeHtml(provider)}" aria-pressed="${state.provider === provider}">${escapeHtml(provider)}</button>`).join("");
  el("categoryFilters").innerHTML = categories.map(category => `<button class="filter-button${state.category === category ? " active" : ""}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">${escapeHtml(category)}</button>`).join("");
}

function renderPublic() {
  const matches = state.publicSkills.filter(publicMatches);
  el("publicSummary").textContent = state.query || state.provider !== "全部来源" || state.category !== "全部" ? `找到 ${matches.length} 个匹配项` : `${state.publicSkills.length} 个公开 Skills，按一级市场任务分类`;
  el("publicSkills").innerHTML = matches.map(skill => skillCard(skill)).join("");
  el("publicSkills").hidden = matches.length === 0;
  el("publicEmpty").hidden = matches.length !== 0;
  renderFilters();
}

function renderPrivate() {
  const authenticated = Boolean(state.user);
  el("lockedState").hidden = authenticated;
  el("privateContent").hidden = !authenticated;
  el("privateActions").hidden = !authenticated;
  el("accountButton").textContent = authenticated ? state.user.username : "登录 / 注册";
  if (!authenticated) return;
  el("welcomeText").textContent = `${state.user.username} 的私人仓库，共 ${state.privateSkills.length} 个 Skills`;
  el("privateSkills").innerHTML = state.privateSkills.map(skill => skillCard(skill, true)).join("");
  el("privateSkills").hidden = state.privateSkills.length === 0;
  el("privateEmpty").hidden = state.privateSkills.length !== 0;
}

async function loadCatalog() {
  const response = await fetch("./catalog.json", {cache: "no-cache"});
  const data = await response.json();
  state.publicSkills = data.skills || [];
  el("publicCount").textContent = state.publicSkills.length;
  renderTasks();
  renderPublic();
}

async function restoreAuth() {
  if (usesSupabase && !state.sessionToken) { renderPrivate(); return; }
  try {
    const data = await api("./api/auth");
    state.user = data.authenticated ? data.user : null;
    state.csrf = data.csrf || null;
    if (state.user) await loadPrivateSkills();
  } catch {
    state.user = null;
    state.csrf = null;
    state.sessionToken = "";
    localStorage.removeItem("skills-desk-session");
  }
  renderPrivate();
}

async function loadPrivateSkills() {
  const data = await api("./api/skills");
  state.privateSkills = data.skills || [];
  renderPrivate();
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  el("authError").textContent = "";
  authDialog.showModal();
  el("authUsername").focus();
}

function setAuthMode(mode) {
  state.authMode = mode;
  document.querySelectorAll("[data-auth-mode]").forEach(button => button.classList.toggle("active", button.dataset.authMode === mode));
  el("authSubmit").textContent = mode === "login" ? "登录" : "注册并创建仓库";
  el("authHelp").textContent = mode === "login" ? "使用你的账号进入私人 Skill 仓库。" : "用户名 3-32 位；密码至少 10 位，并包含字母和数字或符号。";
  el("authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
}

async function submitAuth(event) {
  event.preventDefault();
  el("authError").textContent = "";
  const username = el("authUsername").value.trim();
  const password = el("authPassword").value;
  try {
    const data = await api(state.authMode === "login" ? "./api/login" : "./api/register", {method: "POST", body: JSON.stringify({username, password})});
    state.user = data.user;
    state.csrf = data.csrf;
    if (data.session_token) {
      state.sessionToken = data.session_token;
      localStorage.setItem("skills-desk-session", data.session_token);
    }
    authDialog.close();
    el("authForm").reset();
    await loadPrivateSkills();
    showToast(state.authMode === "login" ? "登录成功" : "账号和私人仓库已创建");
    if (state.user.force_password_change) passwordDialog.showModal();
  } catch (error) {
    const messages = {invalid_credentials:"用户名或密码错误。", username_exists:"这个用户名已经存在。", too_many_attempts:"尝试次数过多，请稍后再试。"};
    el("authError").textContent = error.status === 404 ? "私人仓库服务尚未连接。" : (messages[error.message] || error.message);
  }
}

async function submitPassword(event) {
  event.preventDefault();
  el("passwordError").textContent = "";
  try {
    await api("./api/password", {method:"POST", mutation:true, body:JSON.stringify({current_password:el("currentPassword").value, new_password:el("newPassword").value})});
    state.user.force_password_change = false;
    passwordDialog.close();
    el("passwordForm").reset();
    showToast("密码已更新");
  } catch (error) {
    el("passwordError").textContent = error.message === "invalid_current_password" ? "当前密码错误。" : error.message;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitUpload(event) {
  event.preventDefault();
  el("uploadError").textContent = "";
  const file = el("skillFile").files[0];
  if (!file) return;
  if (file.size > 6 * 1024 * 1024) { el("uploadError").textContent = "ZIP 不能超过 6 MB。"; return; }
  try {
    const contentBase64 = await fileToBase64(file);
    await api("./api/skills", {method:"POST", mutation:true, body:JSON.stringify({filename:file.name, category:el("uploadCategory").value, content_base64:contentBase64})});
    uploadDialog.close();
    el("uploadForm").reset();
    await loadPrivateSkills();
    showToast("Skill 已保存到私人仓库");
  } catch (error) { el("uploadError").textContent = error.message; }
}

async function deleteSkill(id) {
  if (!window.confirm("确认从你的私人仓库删除这个 Skill？")) return;
  try {
    await api(`./api/skills/${encodeURIComponent(id)}`, {method:"DELETE", mutation:true});
    await loadPrivateSkills();
    showToast("Skill 已删除");
  } catch (error) { showToast(error.message); }
}

async function downloadSkill(id, slug) {
  try {
    const response = await fetch(apiUrl(`./api/skills/${encodeURIComponent(id)}/content`), {headers:apiHeaders(), credentials:usesSupabase ? "omit" : "same-origin"});
    if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "下载失败"); }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) { showToast(error.message); }
}

async function downloadBundle() {
  try {
    const response = await fetch(apiUrl("./api/bundle"), {headers:apiHeaders(), credentials:usesSupabase ? "omit" : "same-origin"});
    if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "下载失败"); }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.user.username}-skills.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("整库 ZIP 已下载");
  } catch (error) { showToast(error.message); }
}

async function loadTokens() {
  const data = await api("./api/tokens");
  el("tokenList").innerHTML = data.tokens.length ? data.tokens.map(token => `<div class="token-row"><div><p>${escapeHtml(token.label)}</p><small>${token.revoked_at ? "已撤销" : `创建于 ${escapeHtml(token.created_at)}`}</small></div>${token.revoked_at ? "" : `<button class="text-button" type="button" data-revoke-token="${escapeHtml(token.id)}">撤销</button>`}</div>`).join("") : "<p class='form-help'>还没有 Agent 访问令牌。</p>";
}

async function openTokenDialog() {
  el("generatedToken").hidden = true;
  tokenDialog.showModal();
  try { await loadTokens(); } catch (error) { showToast(error.message); }
}

async function createToken() {
  try {
    const data = await api("./api/tokens", {method:"POST", mutation:true, body:JSON.stringify({label:el("tokenLabel").value.trim() || "Agent token"})});
    const base = usesSupabase ? `${supabaseConfig.url.replace(/\/$/, "")}/functions/v1/skills-api` : window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "").replace(/\/$/, "");
    const install = `mkdir -p "$HOME/.agents/skills" && curl -fsSL -H "Authorization: Bearer ${data.token}" "${base}/api/bundle" -o /tmp/skills-desk-bundle.zip && unzip -qo /tmp/skills-desk-bundle.zip -d "$HOME/.agents/skills"`;
    const upload = `检查我要保存的 Skill，确保目录名与 SKILL.md 的 name 一致，排除凭据、缓存、日志和无关文件，将单一 Skill 根目录打包为 ZIP。然后使用 Authorization: Bearer ${data.token} 调用 ${base}/api/skills，以 JSON 提交 category 和 ZIP 的 content_base64。上传前向我展示文件清单，未经确认不要发送。`;
    el("installCommand").textContent = install;
    el("uploadPrompt").textContent = upload;
    el("generatedToken").hidden = false;
    el("tokenLabel").value = "";
    await loadTokens();
    showToast("令牌已创建，只显示这一次");
  } catch (error) { showToast(error.message); }
}

async function revokeToken(id) {
  try {
    await api(`./api/tokens/${encodeURIComponent(id)}`, {method:"DELETE", mutation:true});
    await loadTokens();
    showToast("令牌已撤销");
  } catch (error) { showToast(error.message); }
}

async function logout() {
  try { await api("./api/logout", {method:"POST", body:"{}"}); } catch {}
  state.user = null;
  state.csrf = null;
  state.sessionToken = "";
  localStorage.removeItem("skills-desk-session");
  state.privateSkills = [];
  renderPrivate();
  showToast("已退出登录");
}

function resetPublic() {
  state.query = ""; state.provider = "全部来源"; state.category = "全部"; el("searchInput").value = ""; renderPublic();
}

document.addEventListener("click", event => {
  const target = event.target;
  const copyPrompt = target.closest("[data-copy-prompt]");
  const task = target.closest("[data-task]");
  const provider = target.closest("[data-provider]");
  const category = target.closest("[data-category]");
  const copyId = target.closest("[data-copy-id]");
  const deleteButton = target.closest("[data-delete-skill]");
  const downloadButton = target.closest("[data-download-skill]");
  const revokeButton = target.closest("[data-revoke-token]");
  if (target.closest("[data-open-auth]")) openAuth();
  if (target.closest("[data-open-upload]")) uploadDialog.showModal();
  if (target.closest("[data-close-dialog]")) target.closest("dialog").close();
  if (target.closest("[data-reset-public]")) resetPublic();
  if (copyPrompt) { const skill = state.publicSkills.find(item => item.id === copyPrompt.dataset.copyPrompt); if (skill) copyText(skill.prompt, `已复制「${skill.title}」调用语`); }
  if (task) { state.category = task.dataset.task; renderPublic(); el("catalog").scrollIntoView({behavior:"smooth"}); }
  if (provider) { state.provider = provider.dataset.provider; renderPublic(); }
  if (category) { state.category = category.dataset.category; renderPublic(); }
  if (copyId) copyText(el(copyId.dataset.copyId).textContent);
  if (deleteButton) deleteSkill(deleteButton.dataset.deleteSkill);
  if (downloadButton) downloadSkill(downloadButton.dataset.downloadSkill, downloadButton.dataset.skillSlug);
  if (revokeButton) revokeToken(revokeButton.dataset.revokeToken);
});

el("searchInput").addEventListener("input", event => { state.query = event.target.value; renderPublic(); });
el("authForm").addEventListener("submit", submitAuth);
el("passwordForm").addEventListener("submit", submitPassword);
el("uploadForm").addEventListener("submit", submitUpload);
el("authMode").addEventListener("click", event => { if (event.target.dataset.authMode) setAuthMode(event.target.dataset.authMode); });
el("accountButton").addEventListener("click", () => state.user ? el("my-skills").scrollIntoView({behavior:"smooth"}) : openAuth());
el("uploadButton").addEventListener("click", () => uploadDialog.showModal());
el("bundleButton").addEventListener("click", downloadBundle);
el("tokenButton").addEventListener("click", openTokenDialog);
el("createTokenButton").addEventListener("click", createToken);
el("logoutButton").addEventListener("click", logout);
el("themeButton").addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("skills-desk-theme", theme);
  el("themeButton").textContent = theme === "dark" ? "浅色模式" : "深色模式";
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) { event.preventDefault(); el("searchInput").focus(); }
});

el("uploadCategory").innerHTML = uploadCategories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
const savedTheme = localStorage.getItem("skills-desk-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.dataset.theme = savedTheme;
el("themeButton").textContent = savedTheme === "dark" ? "浅色模式" : "深色模式";
Promise.all([loadCatalog(), restoreAuth()]).catch(error => { el("publicSummary").textContent = "公开目录读取失败"; showToast(error.message); });
