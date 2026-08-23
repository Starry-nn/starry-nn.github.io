(function () {
  "use strict";

  const cases = Array.isArray(window.AUTOPSY_CASES) ? window.AUTOPSY_CASES : [];
  const translations = {
    en: {
      navMethod: "Method",
      nominate: "Nominate a case",
      eyebrow: "An evidence-led archive of ambitious failures",
      heroTitle: "Every dead startup leaves evidence.",
      heroIntro: "We preserve what was promised, what changed, and what founders can learn after the headlines disappear.",
      openArchive: "Open the archive",
      randomCase: "Draw a random case",
      heroCaption: "Failure is rarely one event. The archive keeps the sequence intact.",
      featuredKicker: "Featured autopsy",
      featuredSummary: "A $7 billion autonomous-driving bet that ran out of strategic patience before the technology reached commercial scale.",
      readFile: "Read the case file",
      certificate: "Certificate of cessation",
      founded: "Founded",
      ceased: "Ceased",
      peakValue: "Reported value",
      capital: "Capital",
      probableCause: "Probable mechanism",
      argoCause: "Long commercialization horizon combined with strategic investor dependency.",
      certificateNote: "Editorial assessment. Open the file to inspect the underlying evidence.",
      archiveTitle: "The archive",
      archiveIntro: "Search by company, sector, or failure mechanism. Every file links back to public evidence.",
      searchLabel: "Search cases",
      searchPlaceholder: "Search the archive",
      clearFilters: "Clear filters",
      emptyTitle: "No case file matches that search.",
      emptyBody: "Try a company name, a sector, or clear the filters.",
      methodTitle: "A postmortem, not a verdict.",
      methodIntro: "Companies fail through a chain of choices, constraints, and timing. We separate records from interpretation so readers can disagree with the diagnosis.",
      methodCollect: "Collect",
      methodCollectBody: "Prefer filings, company statements, and contemporaneous reporting.",
      methodReconstruct: "Reconstruct",
      methodReconstructBody: "Put funding, product shifts, layoffs, and shutdowns back in order.",
      methodSeparate: "Separate",
      methodSeparateBody: "Label verified facts, disputed claims, and editorial inference.",
      methodRevise: "Revise",
      methodReviseBody: "Keep each file open to corrections and stronger evidence.",
      closingLead: "Know a shutdown worth studying?",
      closingTitle: "Help preserve the lesson before the links disappear.",
      nominateCase: "Nominate a case",
      footerNote: "Open research for builders who prefer evidence to mythology.",
      aboutProject: "About this project",
      communityLead: "Community leads",
      nominationTitle: "Nominate a case",
      nominationIntro: "Send one strong source. Your lead stays in this browser in this prototype.",
      companyName: "Company name",
      sourceUrl: "Best source URL",
      whyStudy: "Why should we study it?",
      cancel: "Cancel",
      saveLead: "Save lead",
      all: "All sectors",
      autonomy: "Autonomy",
      health: "Health",
      robotics: "Robotics",
      resultSingle: "1 case file",
      resultPlural: "{count} case files",
      yearClosed: "Year closed",
      reportedValue: "Reported value",
      openFile: "Open case file for {name}",
      record: "Case record",
      sector: "Sector",
      location: "Location",
      status: "Status",
      diagnosis: "Editorial diagnosis",
      timeline: "What happened",
      findings: "Evidence and interpretation",
      fact: "Verified fact",
      inference: "Inference",
      lesson: "What survives",
      sources: "Evidence sources",
      primary: "Primary source",
      reporting: "Reporting",
      close: "Close",
      copyLink: "Copy case link",
      copied: "Link copied",
      requiredCompany: "Enter a company name.",
      requiredSource: "Enter a valid source URL.",
      savedLead: "Lead saved locally. Thank you for adding a trail to follow.",
      switchLanguageLabel: "切换为中文",
      lightTheme: "Light",
      darkTheme: "Dark",
      closeCaseLabel: "Close case file",
      closed: "CLOSED"
    },
    zh: {
      navMethod: "研究方法",
      nominate: "推荐案例",
      eyebrow: "记录野心勃勃的失败，并保留证据",
      heroTitle: "每家消失的创业公司都留下证据。",
      heroIntro: "保存它曾经承诺什么、后来改变什么，以及热搜消失后仍然值得学习的部分。",
      openArchive: "打开档案馆",
      randomCase: "随机抽取案例",
      heroCaption: "失败很少只发生在一个瞬间。档案馆保留完整的事件顺序。",
      featuredKicker: "本期尸检报告",
      featuredSummary: "一场估值超过 70 亿美元的自动驾驶押注，在技术商业化之前先耗尽了战略耐心。",
      readFile: "阅读完整档案",
      certificate: "停止运营证明",
      founded: "成立",
      ceased: "停止",
      peakValue: "披露估值",
      capital: "资本",
      probableCause: "可能的失败机制",
      argoCause: "漫长的商业化周期与对战略投资方的高度依赖同时发生。",
      certificateNote: "这是编辑判断。打开档案可查看支持判断的公开证据。",
      archiveTitle: "死亡档案馆",
      archiveIntro: "按公司、行业或失败机制检索。每份档案都链接回公开证据。",
      searchLabel: "搜索案例",
      searchPlaceholder: "搜索档案馆",
      clearFilters: "清除筛选",
      emptyTitle: "没有匹配的案例档案。",
      emptyBody: "尝试公司名称、行业关键词，或清除筛选条件。",
      methodTitle: "这是复盘，不是判决。",
      methodIntro: "公司往往因为一连串选择、约束和时机而失败。我们把事实记录与编辑判断分开，让读者可以不同意诊断。",
      methodCollect: "收集",
      methodCollectBody: "优先采用监管文件、公司声明和当时的媒体报道。",
      methodReconstruct: "还原",
      methodReconstructBody: "把融资、产品变化、裁员和停止运营重新放回时间顺序。",
      methodSeparate: "区分",
      methodSeparateBody: "分别标记可验证事实、争议信息和编辑推断。",
      methodRevise: "修订",
      methodReviseBody: "接受纠错，并在出现更强证据时更新档案。",
      closingLead: "知道一家值得研究的消失公司？",
      closingTitle: "在链接失效之前，帮我们把教训保存下来。",
      nominateCase: "推荐一个案例",
      footerNote: "为更相信证据而不是神话的建设者提供开放研究。",
      aboutProject: "关于这个项目",
      communityLead: "社区线索",
      nominationTitle: "推荐案例",
      nominationIntro: "提供一个可靠来源。原型阶段的线索只保存在你的浏览器中。",
      companyName: "公司名称",
      sourceUrl: "最佳来源链接",
      whyStudy: "为什么值得研究？",
      cancel: "取消",
      saveLead: "保存线索",
      all: "全部行业",
      autonomy: "自动驾驶",
      health: "医疗",
      robotics: "机器人",
      resultSingle: "1 份案例档案",
      resultPlural: "{count} 份案例档案",
      yearClosed: "停止年份",
      reportedValue: "披露估值",
      openFile: "打开 {name} 的案例档案",
      record: "案例档案",
      sector: "行业",
      location: "地点",
      status: "状态",
      diagnosis: "编辑诊断",
      timeline: "发生了什么",
      findings: "证据与判断",
      fact: "可验证事实",
      inference: "编辑推断",
      lesson: "留下的教训",
      sources: "证据来源",
      primary: "一手来源",
      reporting: "媒体报道",
      close: "关闭",
      copyLink: "复制案例链接",
      copied: "链接已复制",
      requiredCompany: "请输入公司名称。",
      requiredSource: "请输入有效的来源链接。",
      savedLead: "线索已保存在本地。感谢你补上一条可追踪的路径。",
      switchLanguageLabel: "Switch to English",
      lightTheme: "浅色",
      darkTheme: "深色",
      closeCaseLabel: "关闭案例档案",
      closed: "已关闭"
    }
  };

  const state = {
    language: localStorage.getItem("autopsy-language") === "zh" ? "zh" : "en",
    sector: "all",
    query: "",
    openCaseId: null
  };

  const elements = {
    grid: document.querySelector("#case-grid"),
    filters: document.querySelector("#sector-filters"),
    search: document.querySelector("#case-search"),
    resultCount: document.querySelector("#result-count"),
    reset: document.querySelector("#reset-filters"),
    empty: document.querySelector("#empty-state"),
    emptyReset: document.querySelector("#empty-reset"),
    caseDialog: document.querySelector("#case-dialog"),
    caseDetail: document.querySelector("#case-detail"),
    nominationDialog: document.querySelector("#nomination-dialog"),
    nominationForm: document.querySelector("#nomination-form"),
    formStatus: document.querySelector("#form-status"),
    languageToggle: document.querySelector("#language-toggle"),
    themeToggle: document.querySelector("#theme-toggle")
  };

  function t(key, replacements) {
    let value = translations[state.language][key] || translations.en[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([name, replacement]) => {
        value = value.replace(`{${name}}`, replacement);
      });
    }
    return value;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function caseCopy(item) {
    return item[state.language] || item.en;
  }

  function applyTranslations() {
    document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    elements.languageToggle.textContent = state.language === "en" ? "中文" : "EN";
    elements.languageToggle.setAttribute("aria-label", t("switchLanguageLabel"));
    document.querySelector("[data-close-dialog]").textContent = t("close");
    document.querySelector("[data-close-dialog]").setAttribute("aria-label", t("closeCaseLabel"));
    updateThemeLabel();
  }

  function renderFilters() {
    const filters = ["all", "autonomy", "health", "robotics"];
    elements.filters.innerHTML = filters
      .map(
        (filter) => `
          <button
            class="filter-button"
            type="button"
            data-sector="${filter}"
            aria-pressed="${String(state.sector === filter)}"
          >${escapeHtml(t(filter))}</button>
        `
      )
      .join("");
  }

  function getFilteredCases() {
    const normalized = state.query.trim().toLocaleLowerCase(state.language === "zh" ? "zh-CN" : "en-US");
    return cases.filter((item) => {
      const copy = caseCopy(item);
      const sectorMatch = state.sector === "all" || item.sector === state.sector;
      const searchText = [
        item.name,
        item.location,
        item.causeTags.join(" "),
        copy.sectorLabel,
        copy.summary,
        copy.cause
      ]
        .join(" ")
        .toLocaleLowerCase(state.language === "zh" ? "zh-CN" : "en-US");
      return sectorMatch && (!normalized || searchText.includes(normalized));
    });
  }

  function renderSkeletons() {
    elements.grid.setAttribute("aria-busy", "true");
    elements.grid.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card" aria-hidden="true"></div>').join("");
  }

  function renderCases() {
    const filtered = getFilteredCases();
    const hasFilters = state.sector !== "all" || state.query.trim().length > 0;

    elements.resultCount.textContent = filtered.length === 1 ? t("resultSingle") : t("resultPlural", { count: String(filtered.length) });
    elements.reset.hidden = !hasFilters;
    elements.empty.hidden = filtered.length !== 0;
    elements.grid.hidden = filtered.length === 0;
    elements.grid.setAttribute("aria-busy", "false");

    elements.grid.innerHTML = filtered
      .map((item) => {
        const copy = caseCopy(item);
        return `
          <button class="case-card" type="button" data-case-id="${item.id}" aria-label="${escapeHtml(t("openFile", { name: item.name }))}">
            <div>
              <div class="card-topline">
                <span class="card-status">${escapeHtml(copy.statusLabel)}</span>
                <span class="card-year">${escapeHtml(item.ceased)}</span>
              </div>
              <h3>${escapeHtml(item.name)}</h3>
              <p class="card-sector">${escapeHtml(copy.sectorLabel)}</p>
              <p class="card-summary">${escapeHtml(copy.summary)}</p>
            </div>
            <div class="card-bottom">
              <div class="card-stat">
                <span>${escapeHtml(t("reportedValue"))}</span>
                <strong>${escapeHtml(item.peakValue)}</strong>
              </div>
              <div class="card-stat">
                <span>${escapeHtml(t("capital"))}</span>
                <strong>${escapeHtml(copy.capitalLabel || item.capital)}</strong>
              </div>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderCaseDetail(item) {
    const copy = caseCopy(item);
    const recordNumber = `SA-${item.ceased}-${item.id.toUpperCase()}`;

    elements.caseDetail.innerHTML = `
      <header class="detail-header">
        <p class="detail-record">${escapeHtml(t("record"))} ${escapeHtml(recordNumber)}</p>
        <h2 id="dialog-company-name">${escapeHtml(item.name)}</h2>
        <p class="detail-summary">${escapeHtml(copy.summary)}</p>
        <dl class="detail-facts">
          <div><dt>${escapeHtml(t("founded"))}</dt><dd>${escapeHtml(item.founded)}</dd></div>
          <div><dt>${escapeHtml(t("sector"))}</dt><dd>${escapeHtml(copy.sectorLabel)}</dd></div>
          <div><dt>${escapeHtml(t("location"))}</dt><dd>${escapeHtml(item.location)}</dd></div>
          <div><dt>${escapeHtml(t("status"))}</dt><dd>${escapeHtml(copy.statusLabel)}</dd></div>
        </dl>
      </header>

      <section class="detail-section diagnosis">
        <span class="diagnosis-label">${escapeHtml(t("diagnosis"))}</span>
        <p>${escapeHtml(copy.cause)}</p>
      </section>

      <section class="detail-section">
        <h3>${escapeHtml(t("timeline"))}</h3>
        <ol class="timeline">
          ${copy.timeline
            .map(
              (event) => `
                <li>
                  <time>${escapeHtml(event.year)}</time>
                  <strong>${escapeHtml(event.title)}</strong>
                  <p>${escapeHtml(event.body)}</p>
                </li>
              `
            )
            .join("")}
        </ol>
      </section>

      <section class="detail-section">
        <h3>${escapeHtml(t("findings"))}</h3>
        <div class="finding-list">
          ${copy.findings
            .map(
              (finding) => `
                <article class="finding">
                  <span class="finding-type">${escapeHtml(t(finding.type))}</span>
                  <div>
                    <strong>${escapeHtml(finding.title)}</strong>
                    <p>${escapeHtml(finding.body)}</p>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="detail-section">
        <div class="lesson-box">
          <span>${escapeHtml(t("lesson"))}</span>
          <p>${escapeHtml(copy.lesson)}</p>
        </div>
      </section>

      <section class="detail-section">
        <h3>${escapeHtml(t("sources"))}</h3>
        <div class="source-list">
          ${copy.sources
            .map(
              (source) => `
                <a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
                  <strong>${escapeHtml(source.label)}</strong>
                  <span class="source-meta">
                    <span>${escapeHtml(source.publisher)} / ${escapeHtml(source.date)}</span>
                    <span class="${source.primary ? "source-primary" : ""}">${escapeHtml(t(source.primary ? "primary" : "reporting"))}</span>
                  </span>
                </a>
              `
            )
            .join("")}
        </div>
      </section>

      <button class="secondary-button" type="button" id="copy-case-link">${escapeHtml(t("copyLink"))}</button>
    `;

    const copyButton = document.querySelector("#copy-case-link");
    copyButton.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.hash = `case=${item.id}`;
      try {
        await navigator.clipboard.writeText(url.toString());
        copyButton.textContent = t("copied");
      } catch (_error) {
        window.prompt(t("copyLink"), url.toString());
      }
    });
  }

  function openCase(caseId, updateHistory = true) {
    const item = cases.find((candidate) => candidate.id === caseId);
    if (!item) return;

    state.openCaseId = item.id;
    renderCaseDetail(item);
    if (!elements.caseDialog.open) elements.caseDialog.showModal();
    if (updateHistory) history.replaceState(null, "", `#case=${item.id}`);
  }

  function closeCase(updateHistory = true) {
    if (elements.caseDialog.open) elements.caseDialog.close();
    state.openCaseId = null;
    if (updateHistory && window.location.hash.startsWith("#case=")) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  function resetFilters() {
    state.sector = "all";
    state.query = "";
    elements.search.value = "";
    renderFilters();
    renderCases();
  }

  function openNomination() {
    elements.formStatus.textContent = "";
    if (!elements.nominationDialog.open) elements.nominationDialog.showModal();
    window.setTimeout(() => document.querySelector("#nomination-company").focus(), 60);
  }

  function closeNomination() {
    if (elements.nominationDialog.open) elements.nominationDialog.close();
  }

  function validateNomination(formData) {
    const errors = {};
    const company = String(formData.get("company") || "").trim();
    const source = String(formData.get("source") || "").trim();
    if (!company) errors.company = t("requiredCompany");
    try {
      const parsed = new URL(source);
      if (!/^https?:$/.test(parsed.protocol)) errors.source = t("requiredSource");
    } catch (_error) {
      errors.source = t("requiredSource");
    }
    return errors;
  }

  function saveNomination(formData) {
    const saved = JSON.parse(localStorage.getItem("autopsy-nominations") || "[]");
    saved.push({
      company: String(formData.get("company") || "").trim(),
      source: String(formData.get("source") || "").trim(),
      note: String(formData.get("note") || "").trim(),
      savedAt: new Date().toISOString()
    });
    localStorage.setItem("autopsy-nominations", JSON.stringify(saved));
  }

  function getEffectiveTheme() {
    const explicit = document.documentElement.dataset.theme;
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function updateThemeLabel() {
    const theme = getEffectiveTheme();
    elements.themeToggle.textContent = t(theme === "dark" ? "lightTheme" : "darkTheme");
    elements.themeToggle.setAttribute("aria-label", theme === "dark" ? t("lightTheme") : t("darkTheme"));
  }

  function initializeTheme() {
    const saved = localStorage.getItem("autopsy-theme");
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
    updateThemeLabel();
  }

  document.addEventListener("click", (event) => {
    const caseTrigger = event.target.closest("[data-case-id]");
    if (caseTrigger) openCase(caseTrigger.dataset.caseId);

    const filter = event.target.closest("[data-sector]");
    if (filter) {
      state.sector = filter.dataset.sector;
      renderFilters();
      renderCases();
    }

    if (event.target.closest("[data-open-random]")) {
      const item = cases[Math.floor(Math.random() * cases.length)];
      if (item) openCase(item.id);
    }

    if (event.target.closest("[data-open-nomination]")) openNomination();
    if (event.target.closest("[data-close-nomination]")) closeNomination();
    if (event.target.closest("[data-close-dialog]")) closeCase();
  });

  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCases();
  });

  elements.reset.addEventListener("click", resetFilters);
  elements.emptyReset.addEventListener("click", resetFilters);

  elements.languageToggle.addEventListener("click", () => {
    state.language = state.language === "en" ? "zh" : "en";
    localStorage.setItem("autopsy-language", state.language);
    applyTranslations();
    renderFilters();
    renderCases();
    if (state.openCaseId) renderCaseDetail(cases.find((item) => item.id === state.openCaseId));
  });

  elements.themeToggle.addEventListener("click", () => {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("autopsy-theme", next);
    updateThemeLabel();
  });

  elements.nominationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.nominationForm);
    const errors = validateNomination(formData);

    ["company", "source"].forEach((name) => {
      const input = elements.nominationForm.elements[name];
      const error = document.querySelector(`[data-error-for="${name}"]`);
      const message = errors[name] || "";
      input.setAttribute("aria-invalid", String(Boolean(message)));
      error.textContent = message;
    });

    if (Object.keys(errors).length > 0) {
      elements.formStatus.textContent = "";
      elements.nominationForm.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    saveNomination(formData);
    elements.nominationForm.reset();
    elements.formStatus.textContent = t("savedLead");
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement && document.activeElement.tagName;
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(activeTag)) {
      event.preventDefault();
      elements.search.focus();
    }
  });

  elements.caseDialog.addEventListener("click", (event) => {
    if (event.target === elements.caseDialog) closeCase();
  });

  elements.nominationDialog.addEventListener("click", (event) => {
    if (event.target === elements.nominationDialog) closeNomination();
  });

  elements.caseDialog.addEventListener("close", () => {
    if (state.openCaseId) closeCase();
  });

  const colorPreference = window.matchMedia("(prefers-color-scheme: dark)");
  colorPreference.addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) updateThemeLabel();
  });

  initializeTheme();
  applyTranslations();
  renderFilters();
  renderSkeletons();
  window.setTimeout(renderCases, 360);

  const initialMatch = window.location.hash.match(/^#case=([a-z0-9-]+)$/);
  if (initialMatch) window.setTimeout(() => openCase(initialMatch[1], false), 380);
})();
