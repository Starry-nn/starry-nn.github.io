const categories = ["全部", "项目发现", "BP 初筛", "行业研究", "商业尽调", "财务分析", "法务合规", "IC 材料", "投后管理", "募资与 LP", "基金运营", "人才与关系", "会议与知识", "数据与表格", "内容交付", "自动化与工具", "其他"];
const uploadCategories = categories.filter(item => item !== "全部");
const tasks = [
  ["找项目", "项目发现"], ["拆 BP", "BP 初筛"], ["做行研", "行业研究"], ["做尽调", "商业尽调"],
  ["看财务", "财务分析"], ["写 IC", "IC 材料"], ["管投后", "投后管理"], ["做基金运营", "基金运营"]
];

const supabaseConfig = window.SKILLS_DESK_SUPABASE || {url:"", publishableKey:""};
const usesSupabase = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
const state = { publicSkills: [], privateSkills: [], privatePrompts: [], user: null, csrf: null, sessionToken: localStorage.getItem("skills-desk-session") || "", query: "", provider: "全部来源", category: "全部", promptQuery: "", promptCategory: "全部", libraryTab: "skills", authMode: "login", skillDraft: null, promptDraft: null, shareCode: "", sharedOwner: null, sharedSkills: [], sharedPrompts: [], sharedTab: "skills" };
const el = id => document.getElementById(id);
const authDialog = el("authDialog");
const uploadDialog = el("uploadDialog");
const addLibraryDialog = el("addLibraryDialog");
const promptDialog = el("promptDialog");
const tokenDialog = el("tokenDialog");
const shareManageDialog = el("shareManageDialog");
const shareAccessDialog = el("shareAccessDialog");
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
  if (state.sessionToken && !headers.Authorization) headers.Authorization = `Bearer ${state.sessionToken}`;
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
      <div><h3>${escapeHtml(skill.title || skill.name)}</h3><span class="skill-name">${escapeHtml(skill.slug)}</span></div>
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

function sharedSkillCard(skill) {
  return `<article class="skill-card private-card">
    <div class="skill-meta"><span class="provider">${escapeHtml(skill.category)}</span><span class="skill-type">只读授权</span></div>
    <div><h3>${escapeHtml(skill.title || skill.name)}</h3><span class="skill-name">${escapeHtml(skill.slug)}</span></div>
    <div><p class="skill-description">${escapeHtml(skill.description)}</p><p class="skill-when"><strong>包信息</strong>${skill.file_count} 个文件</p></div>
    <div class="skill-actions"><button class="text-button" type="button" data-download-shared-skill="${escapeHtml(skill.id)}" data-skill-slug="${escapeHtml(skill.slug)}">下载 ZIP</button></div>
  </article>`;
}

function promptMatches(prompt) {
  const categoryMatch = state.promptCategory === "全部" || prompt.category === state.promptCategory;
  const words = normalize(state.promptQuery).split(" ").filter(Boolean);
  const haystack = normalize([prompt.name, prompt.slug, prompt.description, prompt.category, ...(prompt.triggers || []), ...(prompt.task_types || [])].join(" "));
  return categoryMatch && words.every(word => haystack.includes(word));
}

function promptCard(prompt, shared = false) {
  const preview = String(prompt.body || "").replace(/^---[\s\S]*?---\s*/, "").trim().slice(0, 220);
  return `<article class="prompt-card">
    <div class="prompt-card-index">PROMPT / ${escapeHtml(prompt.category)}</div>
    <div><h3>${escapeHtml(prompt.name)}</h3><p>${escapeHtml(prompt.description)}</p></div>
    <blockquote>${escapeHtml(preview)}${String(prompt.body || "").trim().length > 220 ? "…" : ""}</blockquote>
    <div class="prompt-tags">${(prompt.triggers || []).slice(0, 4).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    <div class="skill-actions">${shared
      ? `<button class="text-button" type="button" data-copy-shared-prompt="${escapeHtml(prompt.id)}">复制 Prompt</button><button class="text-button" type="button" data-download-shared-prompt="${escapeHtml(prompt.id)}" data-prompt-slug="${escapeHtml(prompt.slug)}">下载 .md</button>`
      : `<button class="text-button" type="button" data-copy-private-prompt="${escapeHtml(prompt.id)}">复制</button><button class="text-button" type="button" data-edit-prompt="${escapeHtml(prompt.id)}">修改</button><button class="text-button" type="button" data-download-prompt="${escapeHtml(prompt.id)}" data-prompt-slug="${escapeHtml(prompt.slug)}">下载</button><button class="text-button danger-text" type="button" data-delete-prompt="${escapeHtml(prompt.id)}">删除</button>`}</div>
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
  el("welcomeText").textContent = `${state.user.username} 的私人方法仓库`;
  el("privateSkillCount").textContent = state.privateSkills.length;
  el("privatePromptCount").textContent = state.privatePrompts.length;
  el("privateSkills").innerHTML = state.privateSkills.map(skill => skillCard(skill, true)).join("");
  el("privateSkills").hidden = state.privateSkills.length === 0;
  el("privateEmpty").hidden = state.privateSkills.length !== 0;
  renderPrivatePrompts();
  setLibraryTab(state.libraryTab);
}

function renderPrivatePrompts() {
  if (!state.user) return;
  const matches = state.privatePrompts.filter(promptMatches);
  el("privatePrompts").innerHTML = matches.map(promptCard).join("");
  el("privatePrompts").hidden = matches.length === 0;
  el("promptEmpty").hidden = matches.length !== 0;
  const emptyTitle = el("promptEmpty").querySelector("h3");
  const emptyCopy = el("promptEmpty").querySelector("p");
  emptyTitle.textContent = state.privatePrompts.length ? "没有匹配的 Prompt" : "Prompt 仓库还是空的";
  emptyCopy.textContent = state.privatePrompts.length ? "换一个关键词或分类试试。" : "粘贴主要内容，系统会建议名称、分类、用途和触发条件，确认后才保存。";
  const available = ["全部", ...new Set(state.privatePrompts.map(prompt => prompt.category))];
  el("promptCategoryFilters").innerHTML = available.map(category => `<button class="filter-button${state.promptCategory === category ? " active" : ""}" type="button" data-prompt-category="${escapeHtml(category)}" aria-pressed="${state.promptCategory === category}">${escapeHtml(category)}</button>`).join("");
}

function setLibraryTab(tab) {
  state.libraryTab = tab === "prompts" ? "prompts" : "skills";
  el("skillsPanel").hidden = state.libraryTab !== "skills";
  el("promptsPanel").hidden = state.libraryTab !== "prompts";
  document.querySelectorAll("[data-library-tab]").forEach(button => {
    const active = button.dataset.libraryTab === state.libraryTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
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
    if (state.user) await loadPrivateLibrary();
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

async function loadPrivatePrompts() {
  const data = await api("./api/prompts");
  state.privatePrompts = data.prompts || [];
  renderPrivate();
}

async function loadPrivateLibrary() {
  const [skills, prompts] = await Promise.all([api("./api/skills"), api("./api/prompts")]);
  state.privateSkills = skills.skills || [];
  state.privatePrompts = prompts.prompts || [];
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
    await loadPrivateLibrary();
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
  if (!state.skillDraft) { el("uploadError").textContent = "请先整理并确认上传信息。"; return; }
  try {
    await api("./api/skills", {method:"POST", mutation:true, body:JSON.stringify({filename:state.skillDraft.filename, title:el("uploadTitle").value, description:el("uploadDescription").value, category:el("uploadCategory").value, content_base64:state.skillDraft.contentBase64})});
    uploadDialog.close();
    resetSkillDialog();
    await loadPrivateSkills();
    showToast("Skill 已保存到私人仓库");
  } catch (error) { el("uploadError").textContent = error.message; }
}

async function analyzeSkill() {
  el("uploadError").textContent = "";
  const file = el("skillFile").files[0];
  if (!file) { el("uploadError").textContent = "请选择一个 Skill ZIP。"; return; }
  if (file.size > 6 * 1024 * 1024) { el("uploadError").textContent = "ZIP 不能超过 6 MB。"; return; }
  const button = el("analyzeSkillButton");
  button.disabled = true; button.textContent = "正在检查目录…";
  try {
    const contentBase64 = await fileToBase64(file);
    const data = await api("./api/skills/analyze", {method:"POST", mutation:true, body:JSON.stringify({filename:file.name, hint:el("skillHint").value, content_base64:contentBase64})});
    state.skillDraft = {filename:file.name, contentBase64, proposal:data.proposal};
    el("uploadTitle").value = data.proposal.title;
    el("uploadDescription").value = data.proposal.description;
    el("uploadCategory").value = data.proposal.category;
    el("skillReviewSummary").textContent = `${data.proposal.slug} · ${data.proposal.file_count} 个文件${data.similar ? " · 仓库中已有同名 Skill，确认保存将更新它" : ""}`;
    el("skillInstallNote").textContent = data.proposal.install_note;
    el("skillAlternative").hidden = !data.proposal.alternative;
    el("skillAlternative").textContent = data.proposal.alternative ? `${data.proposal.alternative.reason} 改存为 Prompt →` : "";
    el("skillInputStep").hidden = true;
    el("skillReviewStep").hidden = false;
  } catch (error) { el("uploadError").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "整理上传信息"; }
}

function resetSkillDialog() {
  el("uploadForm").reset();
  el("skillInputStep").hidden = false;
  el("skillReviewStep").hidden = true;
  el("uploadError").textContent = "";
  state.skillDraft = null;
}

function moveSkillToPrompt() {
  const alternative = state.skillDraft?.proposal?.alternative;
  if (!alternative) return;
  const hint = el("skillHint").value;
  uploadDialog.close();
  resetPromptDialog();
  promptDialog.showModal();
  el("promptHint").value = hint;
  el("promptBody").value = alternative.body;
  analyzePrompt();
}

function openSkillDialog() {
  resetSkillDialog();
  uploadDialog.showModal();
}

async function analyzePrompt() {
  el("promptError").textContent = "";
  const body = el("promptBody").value;
  if (body.trim().length < 12) { el("promptError").textContent = "请粘贴至少 12 个字的 Prompt 主要内容。"; return; }
  const button = el("analyzePromptButton");
  button.disabled = true; button.textContent = "正在整理名称与分类…";
  try {
    const data = await api("./api/prompts/analyze", {method:"POST", mutation:true, body:JSON.stringify({body, hint:el("promptHint").value})});
    state.promptDraft = {body:data.body, slug:data.proposal.slug, language:data.proposal.language};
    el("promptName").value = data.proposal.name;
    el("promptDescription").value = data.proposal.description;
    el("promptReviewBody").value = data.body;
    el("promptCategory").value = data.proposal.category;
    el("promptTriggers").value = data.proposal.triggers.join("，");
    el("promptTaskTypes").value = data.proposal.task_types.join("，");
    el("promptInputs").value = data.proposal.inputs.join("，");
    el("promptOutputs").value = data.proposal.outputs.join("，");
    el("promptDuplicateNote").hidden = !data.similar.length;
    el("promptDuplicateNote").textContent = data.similar.length ? `发现 ${data.similar.length} 个可能重复的 Prompt，请确认名称和用途后再保存。` : "";
    el("promptInputStep").hidden = true;
    el("promptReviewStep").hidden = false;
  } catch (error) { el("promptError").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "智能整理，进入确认"; }
}

function listValue(id) { return el(id).value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean); }

async function submitPrompt(event) {
  event.preventDefault();
  el("promptError").textContent = "";
  if (!state.promptDraft) { el("promptError").textContent = "请先智能整理 Prompt。"; return; }
  try {
    const editing = Boolean(state.promptDraft.editingId);
    const data = await api(editing ? `./api/prompts/${encodeURIComponent(state.promptDraft.editingId)}` : "./api/prompts", {method:editing ? "PUT" : "POST", mutation:true, body:JSON.stringify({
      ...state.promptDraft, body:el("promptReviewBody").value, name:el("promptName").value, description:el("promptDescription").value, category:el("promptCategory").value,
      triggers:listValue("promptTriggers"), task_types:listValue("promptTaskTypes"), inputs:listValue("promptInputs"), outputs:listValue("promptOutputs")
    })});
    promptDialog.close();
    resetPromptDialog();
    state.libraryTab = "prompts";
    await loadPrivatePrompts();
    showToast(editing ? `Prompt 已更新为 v${data.prompt.version}` : "Prompt 已保存，可以直接复制使用");
  } catch (error) { el("promptError").textContent = error.message === "prompt_exists" ? "仓库中已有相同 Prompt，请修改名称或保留现有版本。" : error.message; }
}

function resetPromptDialog() {
  el("promptForm").reset();
  el("promptInputStep").hidden = false;
  el("promptReviewStep").hidden = true;
  el("promptDuplicateNote").hidden = true;
  el("promptError").textContent = "";
  el("promptDialogTitle").textContent = "添加 Prompt";
  el("promptSaveButton").textContent = "确认并保存 Prompt";
  el("backToPromptInput").hidden = false;
  state.promptDraft = null;
}

function openPromptDialog() {
  resetPromptDialog();
  promptDialog.showModal();
  el("promptBody").focus();
}

function editPrompt(id) {
  const prompt = state.privatePrompts.find(item => item.id === id);
  if (!prompt) return;
  resetPromptDialog();
  state.promptDraft = {editingId:prompt.id, slug:prompt.slug, language:prompt.language, version:prompt.version};
  el("promptName").value = prompt.name;
  el("promptDescription").value = prompt.description;
  el("promptReviewBody").value = prompt.body;
  el("promptCategory").value = prompt.category;
  el("promptTriggers").value = (prompt.triggers || []).join("，");
  el("promptTaskTypes").value = (prompt.task_types || []).join("，");
  el("promptInputs").value = (prompt.inputs || []).join("，");
  el("promptOutputs").value = (prompt.outputs || []).join("，");
  el("promptInputStep").hidden = true;
  el("promptReviewStep").hidden = false;
  el("backToPromptInput").hidden = true;
  el("promptDialogTitle").textContent = `修改 Prompt · v${prompt.version}`;
  el("promptSaveButton").textContent = `确认修改并保存为 v${prompt.version + 1}`;
  promptDialog.showModal();
}

async function readPromptFile() {
  const file = el("promptFile").files[0];
  if (!file) return;
  if (file.size > 500000) { el("promptError").textContent = "Prompt 文件不能超过 500 KB。"; return; }
  el("promptBody").value = await file.text();
  if (!el("promptHint").value) el("promptHint").value = file.name.replace(/\.(md|txt)$/i, "");
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

async function deletePrompt(id) {
  if (!window.confirm("确认从你的私人仓库删除这个 Prompt？")) return;
  try {
    await api(`./api/prompts/${encodeURIComponent(id)}`, {method:"DELETE", mutation:true});
    await loadPrivatePrompts();
    showToast("Prompt 已删除");
  } catch (error) { showToast(error.message); }
}

async function downloadPrompt(id, slug) {
  try {
    const response = await fetch(apiUrl(`./api/prompts/${encodeURIComponent(id)}/download`), {headers:apiHeaders(), credentials:usesSupabase ? "omit" : "same-origin"});
    if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "下载失败"); }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${slug}.md`; anchor.click(); URL.revokeObjectURL(url);
  } catch (error) { showToast(error.message); }
}

async function downloadPromptBundle() {
  try {
    const response = await fetch(apiUrl("./api/prompts/bundle"), {headers:apiHeaders(), credentials:usesSupabase ? "omit" : "same-origin"});
    if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "下载失败"); }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${state.user.username}-prompts.zip`; anchor.click(); URL.revokeObjectURL(url);
    showToast("Prompt 整库已下载");
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
    const upload = `判断我要保存的内容适合 Prompt 还是 Skill。Prompt：保留原文，使用 Authorization: Bearer ${data.token} 调用 ${base}/api/prompts/analyze，提交 body 和 hint；向我展示建议的 name、description、category、triggers、task_types、inputs、outputs 和可能重复项，等我确认或修改后再调用 ${base}/api/prompts 保存。Skill：检查目录名与 SKILL.md 的 name 一致，排除凭据、缓存、日志和无关文件，将单一根目录打包为 ZIP；调用 ${base}/api/skills/analyze 提交 hint 和 content_base64，向我展示名称、说明、分类、文件清单与安装信息，确认后再调用 ${base}/api/skills 保存。任何内容都未经确认不得上传。`;
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

function shareStatus(share) {
  if (share.revoked_at) return "已撤销";
  if (share.expires_at && new Date(share.expires_at).getTime() <= Date.now()) return "已过期";
  return share.expires_at ? `有效至 ${new Date(share.expires_at).toLocaleDateString("zh-CN")}` : "长期有效";
}

async function loadShares() {
  const data = await api("./api/shares");
  el("shareList").innerHTML = data.shares.length ? data.shares.map(share => `<div class="token-row"><div><p>${escapeHtml(share.label)}</p><small>${escapeHtml(shareStatus(share))}${share.last_used_at ? ` · 最近访问 ${escapeHtml(new Date(share.last_used_at).toLocaleDateString("zh-CN"))}` : ""}</small></div>${share.revoked_at ? "" : `<button class="text-button danger-text" type="button" data-revoke-share="${escapeHtml(share.id)}">撤销</button>`}</div>`).join("") : "<p class='form-help'>还没有创建仓库授权码。</p>";
}

async function openShareManage() {
  el("generatedShare").hidden = true;
  shareManageDialog.showModal();
  try { await loadShares(); } catch (error) { showToast(error.message); }
}

async function createShare() {
  try {
    const data = await api("./api/shares", {method:"POST", mutation:true, body:JSON.stringify({label:el("shareLabel").value.trim() || "共享访问", expires_days:Number(el("shareExpiry").value)})});
    el("shareCodeOutput").textContent = data.code;
    el("generatedShare").hidden = false;
    el("shareLabel").value = "";
    await loadShares();
    showToast("授权码已生成，只显示这一次");
  } catch (error) { showToast(error.message); }
}

async function revokeShare(id) {
  try {
    await api(`./api/shares/${encodeURIComponent(id)}`, {method:"DELETE", mutation:true});
    await loadShares();
    showToast("授权码已撤销");
  } catch (error) { showToast(error.message); }
}

function openShareAccess() {
  el("shareAccessError").textContent = "";
  shareAccessDialog.showModal();
  if (!state.shareCode) el("shareCodeInput").focus();
}

async function submitShareAccess(event) {
  event.preventDefault();
  el("shareAccessError").textContent = "";
  const code = el("shareCodeInput").value.trim();
  try {
    const data = await api("./api/share/open", {method:"POST", body:JSON.stringify({code})});
    state.shareCode = code;
    state.sharedOwner = data.owner;
    state.sharedSkills = data.skills || [];
    state.sharedPrompts = data.prompts || [];
    renderSharedRepository();
    showToast("已打开只读授权仓库");
  } catch (error) {
    el("shareAccessError").textContent = error.message === "invalid_share_code" ? "授权码无效、已过期或已被撤销。" : error.message;
  }
}

function renderSharedRepository() {
  const active = Boolean(state.shareCode && state.sharedOwner);
  shareAccessDialog.classList.toggle("browsing", active);
  el("shareAccessForm").hidden = active;
  el("sharedRepository").hidden = !active;
  if (!active) { el("sharedDialogTitle").textContent = "输入仓库授权码"; return; }
  el("sharedDialogTitle").textContent = `${state.sharedOwner.username} 的授权仓库`;
  el("sharedSummary").textContent = `只读访问 · ${state.sharedSkills.length} 个 Skills · ${state.sharedPrompts.length} 个 Prompts`;
  el("sharedSkillCount").textContent = state.sharedSkills.length;
  el("sharedPromptCount").textContent = state.sharedPrompts.length;
  el("sharedSkills").innerHTML = state.sharedSkills.length ? state.sharedSkills.map(sharedSkillCard).join("") : "<p class='form-help'>这个仓库还没有 Skill。</p>";
  el("sharedPrompts").innerHTML = state.sharedPrompts.length ? state.sharedPrompts.map(prompt => promptCard(prompt, true)).join("") : "<p class='form-help'>这个仓库还没有 Prompt。</p>";
  setSharedTab(state.sharedTab);
}

function setSharedTab(tab) {
  state.sharedTab = tab === "prompts" ? "prompts" : "skills";
  el("sharedSkillsPanel").hidden = state.sharedTab !== "skills";
  el("sharedPromptsPanel").hidden = state.sharedTab !== "prompts";
  document.querySelectorAll("[data-shared-tab]").forEach(button => {
    const active = button.dataset.sharedTab === state.sharedTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function leaveShared() {
  state.shareCode = ""; state.sharedOwner = null; state.sharedSkills = []; state.sharedPrompts = [];
  el("shareCodeInput").value = "";
  renderSharedRepository();
}

async function downloadShared(path, filename) {
  try {
    const response = await fetch(apiUrl(path), {headers:apiHeaders({Authorization:`Bearer ${state.shareCode}`}), credentials:usesSupabase ? "omit" : "same-origin"});
    if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "下载失败"); }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  } catch (error) { showToast(error.message === "invalid_share_code" ? "授权码已失效。" : error.message); }
}

async function logout() {
  try { await api("./api/logout", {method:"POST", body:"{}"}); } catch {}
  state.user = null;
  state.csrf = null;
  state.sessionToken = "";
  localStorage.removeItem("skills-desk-session");
  state.privateSkills = [];
  state.privatePrompts = [];
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
  const libraryTab = target.closest("[data-library-tab]");
  const promptCategory = target.closest("[data-prompt-category]");
  const copyPrivatePrompt = target.closest("[data-copy-private-prompt]");
  const downloadPromptButton = target.closest("[data-download-prompt]");
  const deletePromptButton = target.closest("[data-delete-prompt]");
  const editPromptButton = target.closest("[data-edit-prompt]");
  const revokeShareButton = target.closest("[data-revoke-share]");
  const sharedTab = target.closest("[data-shared-tab]");
  const copySharedPrompt = target.closest("[data-copy-shared-prompt]");
  const downloadSharedPrompt = target.closest("[data-download-shared-prompt]");
  const downloadSharedSkill = target.closest("[data-download-shared-skill]");
  const chooseAdd = target.closest("[data-choose-add]");
  if (target.closest("[data-open-auth]")) openAuth();
  if (target.closest("[data-open-upload]")) openSkillDialog();
  if (target.closest("[data-open-prompt]")) openPromptDialog();
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
  if (libraryTab) setLibraryTab(libraryTab.dataset.libraryTab);
  if (promptCategory) { state.promptCategory = promptCategory.dataset.promptCategory; renderPrivatePrompts(); }
  if (copyPrivatePrompt) { const prompt = state.privatePrompts.find(item => item.id === copyPrivatePrompt.dataset.copyPrivatePrompt); if (prompt) copyText(prompt.body, `已复制「${prompt.name}」`); }
  if (downloadPromptButton) downloadPrompt(downloadPromptButton.dataset.downloadPrompt, downloadPromptButton.dataset.promptSlug);
  if (deletePromptButton) deletePrompt(deletePromptButton.dataset.deletePrompt);
  if (editPromptButton) editPrompt(editPromptButton.dataset.editPrompt);
  if (revokeShareButton) revokeShare(revokeShareButton.dataset.revokeShare);
  if (sharedTab) setSharedTab(sharedTab.dataset.sharedTab);
  if (copySharedPrompt) { const prompt = state.sharedPrompts.find(item => item.id === copySharedPrompt.dataset.copySharedPrompt); if (prompt) copyText(prompt.body, `已复制「${prompt.name}」`); }
  if (downloadSharedPrompt) downloadShared(`./api/share/prompts/${encodeURIComponent(downloadSharedPrompt.dataset.downloadSharedPrompt)}/download`, `${downloadSharedPrompt.dataset.promptSlug}.md`);
  if (downloadSharedSkill) downloadShared(`./api/share/skills/${encodeURIComponent(downloadSharedSkill.dataset.downloadSharedSkill)}/content`, `${downloadSharedSkill.dataset.skillSlug}.zip`);
  if (chooseAdd) { addLibraryDialog.close(); chooseAdd.dataset.chooseAdd === "skill" ? openSkillDialog() : openPromptDialog(); }
});

el("searchInput").addEventListener("input", event => { state.query = event.target.value; renderPublic(); });
el("authForm").addEventListener("submit", submitAuth);
el("passwordForm").addEventListener("submit", submitPassword);
el("uploadForm").addEventListener("submit", submitUpload);
el("promptForm").addEventListener("submit", submitPrompt);
el("shareAccessForm").addEventListener("submit", submitShareAccess);
el("analyzeSkillButton").addEventListener("click", analyzeSkill);
el("analyzePromptButton").addEventListener("click", analyzePrompt);
el("promptFile").addEventListener("change", readPromptFile);
el("backToSkillInput").addEventListener("click", () => { el("skillInputStep").hidden = false; el("skillReviewStep").hidden = true; state.skillDraft = null; });
el("backToPromptInput").addEventListener("click", () => { el("promptInputStep").hidden = false; el("promptReviewStep").hidden = true; state.promptDraft = null; });
el("skillAlternative").addEventListener("click", moveSkillToPrompt);
el("authMode").addEventListener("click", event => { if (event.target.dataset.authMode) setAuthMode(event.target.dataset.authMode); });
el("accountButton").addEventListener("click", () => state.user ? el("my-library").scrollIntoView({behavior:"smooth"}) : openAuth());
el("addLibraryButton").addEventListener("click", () => addLibraryDialog.showModal());
el("shareManageButton").addEventListener("click", openShareManage);
el("shareAccessButton").addEventListener("click", openShareAccess);
el("bundleButton").addEventListener("click", downloadBundle);
el("promptBundleButton").addEventListener("click", downloadPromptBundle);
el("tokenButton").addEventListener("click", openTokenDialog);
el("createTokenButton").addEventListener("click", createToken);
el("createShareButton").addEventListener("click", createShare);
el("leaveSharedButton").addEventListener("click", leaveShared);
el("sharedSkillBundleButton").addEventListener("click", () => downloadShared("./api/share/skills/bundle", `${state.sharedOwner?.username || "shared"}-skills.zip`));
el("sharedPromptBundleButton").addEventListener("click", () => downloadShared("./api/share/prompts/bundle", `${state.sharedOwner?.username || "shared"}-prompts.zip`));
el("logoutButton").addEventListener("click", logout);
el("promptSearchInput").addEventListener("input", event => { state.promptQuery = event.target.value; renderPrivatePrompts(); });
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
el("promptCategory").innerHTML = uploadCategories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
const savedTheme = localStorage.getItem("skills-desk-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.dataset.theme = savedTheme;
el("themeButton").textContent = savedTheme === "dark" ? "浅色模式" : "深色模式";
Promise.all([loadCatalog(), restoreAuth()]).catch(error => { el("publicSummary").textContent = "公开目录读取失败"; showToast(error.message); });
