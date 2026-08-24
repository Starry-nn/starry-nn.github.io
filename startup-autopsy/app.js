(function () {
  "use strict";

  const cases = [
    ...(Array.isArray(window.AUTOPSY_CASES_2026) ? window.AUTOPSY_CASES_2026 : []),
    ...(Array.isArray(window.AUTOPSY_CASES) ? window.AUTOPSY_CASES : [])
  ].map((item) => ({
    region: item.region || "global",
    outcome: item.outcome || "other",
    eventDate: item.eventDate || `${item.ceased}-01-01`,
    ...item
  }));
  const translations = {
    en: {
      navLab: "Cause of death",
      navMethod: "Method",
      nominate: "Nominate a case",
      eyebrow: "Digital forensics for dead startups",
      heroTitle: "Every death leaves a chain of evidence.",
      heroIntro: "We examine public records to separate fatal damage from noise, hindsight, and myth.",
      openArchive: "Enter the archive",
      randomCase: "Draw a case file",
      heroCaption: "Evidence item A: the archive preserves sequence, source, and uncertainty.",
      featuredKicker: "Priority examination",
      featuredSummary: "A $7 billion autonomous-driving bet that ran out of strategic patience before the technology reached commercial scale.",
      readFile: "Read the case file",
      certificate: "Postmortem report",
      founded: "Founded",
      ceased: "Time of death",
      peakValue: "Reported value",
      capital: "Capital",
      probableCause: "Preliminary cause",
      argoCause: "Long commercialization horizon combined with strategic investor dependency.",
      certificateNote: "Editorial assessment. Open the file to inspect the underlying evidence.",
      archiveTitle: "The death archive",
      archiveIntro: "Search the evidence room, compare files, and challenge the diagnosis. Every claim leads back to a public record.",
      labIndex: "Interactive examination", labTitle: "Name the cause of death.",
      labIntro: "Read three pieces of evidence, choose the primary failure mechanism, then open the full file.",
      subjectSealed: "Identity sealed", streak: "Current streak", chooseCause: "Choose the primary mechanism",
      nextAutopsy: "Examine another", openFullFile: "Open full file", evidenceItem: "Evidence {number}",
      verdictCorrect: "Cause confirmed", verdictWrong: "Diagnosis rejected", verdictCorrectBody: "Your diagnosis matches the archive's primary mechanism.",
      verdictWrongBody: "The archive classifies the primary mechanism as {cause}.", identityRevealed: "Identity confirmed",
      causeCapital: "Capital failure", causeMarket: "No durable market", causeCompetition: "Moat collapse", causeStrategy: "Strategic withdrawal", causeRegulation: "Compliance shock",
      snapshotTitle: "2026, so far",
      snapshotIntro: "A verified public sample through August 23. China leads the archive; global cases provide comparison.",
      view2026: "View 2026 files",
      coverageNote: "Coverage includes court-accepted liquidation, confirmed shutdowns, and core product sunsets. It excludes layoffs, rumors, and pending petitions.",
      filterYear: "Year", filterRegion: "Region", filterOutcome: "Outcome", sortBy: "Sort",
      allYears: "All years", historical: "Historical", allRegions: "All regions", china: "China", global: "Global",
      allOutcomes: "All outcomes", bankruptcy: "Bankruptcy", shutdown: "Shutdown", productSunset: "Product sunset", otherOutcome: "Other exit",
      newest: "Newest first", oldest: "Oldest first", byName: "Name",
      statFiles: "verified 2026 files", statChina: "from China", statGlobal: "global comparisons", statSources: "linked sources",
      compare: "Add to examination", selected: "On the bench", compareCases: "Compare remains", compareTitle: "Parallel examination", clearCompare: "Clear",
      compareCount: "{count} selected, choose 2 or 3", compareNeedTwo: "Select at least 2 files to compare.",
      coreMechanism: "Core mechanism", takeaway: "What this tells us", eventDate: "Event date",
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
      "ai-app": "AI applications", "ai-companion": "AI companion", hardware: "Smart hardware", productivity: "Productivity", "ai-infra": "AI infrastructure",
      resultSingle: "1 case file",
      resultPlural: "{count} case files",
      yearClosed: "Year closed",
      reportedValue: "Reported value",
      openFile: "Open case file for {name}",
      record: "Autopsy file",
      sector: "Sector",
      location: "Location",
      status: "Status",
      diagnosis: "Forensic opinion",
      timeline: "Terminal sequence",
      findings: "Evidence and interpretation",
      fact: "Examined fact",
      inference: "Forensic inference",
      lesson: "Finding for the living",
      sources: "Chain of evidence",
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
      navLab: "死因盲猜",
      navMethod: "研究方法",
      nominate: "提交线索",
      eyebrow: "数字法医科 / 创业公司死亡档案",
      heroTitle: "每一次死亡，都有证据链。",
      heroIntro: "从公开材料中检验致命伤，区分事实、推断与事后神话。",
      openArchive: "进入档案馆",
      randomCase: "随机调取案卷",
      heroCaption: "证物 A：档案保留事件顺序、原始来源和仍未确定的部分。",
      featuredKicker: "重点尸检",
      featuredSummary: "一家估值超过 70 亿美元的自动驾驶公司，在技术规模化之前先失去了股东的战略耐心。",
      readFile: "查看完整档案",
      certificate: "尸检报告",
      founded: "成立",
      ceased: "死亡时间",
      peakValue: "披露估值",
      capital: "资本",
      probableCause: "初步死因",
      argoCause: "漫长的商业化周期与对战略投资方的高度依赖同时发生。",
      certificateNote: "这是基于公开材料的编辑判断，完整证据见案例详情。",
      archiveTitle: "死亡档案馆",
      archiveIntro: "在证物室里搜索、对照并质疑结论。每一项判断都能追溯到公开材料。",
      labIndex: "互动尸检", labTitle: "只看证据，你能判断死因吗？",
      labIntro: "先读三条证据，再选择首要失败机制，最后揭晓公司和完整尸检结论。",
      subjectSealed: "身份封存", streak: "连续命中", chooseCause: "选择首要失败机制",
      nextAutopsy: "再验一例", openFullFile: "查看完整尸检", evidenceItem: "证物 {number}",
      verdictCorrect: "死因吻合", verdictWrong: "诊断未通过", verdictCorrectBody: "你的判断与档案的首要失败机制一致。",
      verdictWrongBody: "档案将首要失败机制归为：{cause}。", identityRevealed: "身份确认",
      causeCapital: "资金链断裂", causeMarket: "没有稳定市场", causeCompetition: "壁垒失守", causeStrategy: "战略撤退", causeRegulation: "合规冲击",
      snapshotTitle: "2026 年度切片",
      snapshotIntro: "统计截至 8 月 23 日的公开可核验样本，以国内案例为主，并加入海外对照。",
      view2026: "只看 2026 年",
      coverageNote: "收录范围包括法院已受理的破产清算、官方确认的停运，以及核心产品下线；不收录普通裁员、传闻和仍在申请阶段的案件。",
      filterYear: "时间", filterRegion: "地区", filterOutcome: "退出方式", sortBy: "排序",
      allYears: "全部年份", historical: "历史案例", allRegions: "全部地区", china: "国内", global: "海外",
      allOutcomes: "全部方式", bankruptcy: "破产清算", shutdown: "公司停运", productSunset: "产品下线", otherOutcome: "其他退出",
      newest: "按时间从近到远", oldest: "按时间从远到近", byName: "按名称",
      statFiles: "份 2026 档案", statChina: "份国内样本", statGlobal: "份海外对照", statSources: "条公开来源",
      compare: "送上解剖台", selected: "已上台", compareCases: "并排解剖", compareTitle: "并排尸检", clearCompare: "清台",
      compareCount: "已选 {count} 份，请选择 2 至 3 份", compareNeedTwo: "至少选择 2 份档案才能对比。",
      coreMechanism: "核心症结", takeaway: "这件事告诉我们什么", eventDate: "事件时间",
      searchLabel: "搜索案例",
      searchPlaceholder: "搜索公司、产品或失败原因",
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
      closingLead: "还有遗漏的项目？",
      closingTitle: "趁公开链接还在，帮我们把证据补齐。",
      nominateCase: "提交一条线索",
      footerNote: "给愿意从真实失败中学习的人，一份持续更新的公开档案。",
      aboutProject: "关于这个项目",
      communityLead: "补充档案",
      nominationTitle: "提交案例线索",
      nominationIntro: "请附上一条可靠来源。当前版本会先把线索保存在你的浏览器中。",
      companyName: "公司名称",
      sourceUrl: "最佳来源链接",
      whyStudy: "为什么这件事值得复盘？",
      cancel: "取消",
      saveLead: "提交线索",
      all: "全部行业",
      autonomy: "自动驾驶",
      health: "医疗",
      robotics: "机器人",
      "ai-app": "AI 应用", "ai-companion": "AI 陪伴", hardware: "智能硬件", productivity: "效率工具", "ai-infra": "AI 基础设施",
      resultSingle: "1 份案例档案",
      resultPlural: "{count} 份案例档案",
      yearClosed: "停止年份",
      reportedValue: "披露估值",
      openFile: "打开 {name} 的案例档案",
      record: "尸检编号",
      sector: "行业",
      location: "地点",
      status: "状态",
      diagnosis: "法医意见",
      timeline: "死亡过程",
      findings: "证物与判断",
      fact: "检验事实",
      inference: "法医推断",
      lesson: "给生者的结论",
      sources: "证据链",
      primary: "一手来源",
      reporting: "媒体报道",
      close: "关闭",
      copyLink: "复制案例链接",
      copied: "链接已复制",
      requiredCompany: "请输入公司名称。",
      requiredSource: "请输入有效的来源链接。",
      savedLead: "线索已保存在本机。谢谢你补上一条可核验的证据。",
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
    year: "all",
    region: "all",
    outcome: "all",
    sort: "newest",
    compare: [],
    labCaseId: null,
    labAnswered: false,
    labStreak: Number.parseInt(localStorage.getItem("autopsy-streak") || "0", 10) || 0,
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
    themeToggle: document.querySelector("#theme-toggle"),
    yearFilter: document.querySelector("#year-filter"),
    regionFilter: document.querySelector("#region-filter"),
    outcomeFilter: document.querySelector("#outcome-filter"),
    sortFilter: document.querySelector("#sort-filter"),
    snapshotStats: document.querySelector("#snapshot-stats"),
    compareTray: document.querySelector("#compare-tray"),
    compareCount: document.querySelector("#compare-count"),
    compareDialog: document.querySelector("#compare-dialog"),
    compareDetail: document.querySelector("#compare-detail"),
    labSubjectName: document.querySelector("#lab-subject-name"),
    labSubjectFacts: document.querySelector("#lab-subject-facts"),
    labEvidence: document.querySelector("#lab-evidence"),
    labOptions: document.querySelector("#lab-options"),
    labVerdict: document.querySelector("#lab-verdict"),
    labStreak: document.querySelector("#lab-streak"),
    nextAutopsy: document.querySelector("#next-autopsy"),
    openAutopsyFile: document.querySelector("#open-autopsy-file")
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

  const causeKeys = ["causeCapital", "causeMarket", "causeCompetition", "causeStrategy", "causeRegulation"];

  function classifyCause(item) {
    const tags = (item.causeTags || []).join(" ").toLowerCase();
    if (tags.includes("regulation") || tags.includes("compliance")) return "causeRegulation";
    if (tags.includes("product market fit") || tags.includes("opportunity cost") || tags.includes("consumer retention")) return "causeMarket";
    if (item.outcome === "acqui-hire" || item.outcome === "pivot" || tags.includes("feature consolidation") || tags.includes("portfolio shift") || tags.includes("strategic pivot")) return "causeStrategy";
    if (tags.includes("commoditization") || tags.includes("competition") || tags.includes("distribution") || tags.includes("model evolution") || tags.includes("moat")) return "causeCompetition";
    return "causeCapital";
  }

  function maskIdentity(text, item) {
    const variants = [item.name, item.name.replace(/[（(].*?[）)]/g, ""), item.name.split(".")[0]].filter((value) => value.length > 2);
    return variants.reduce((result, value) => result.replaceAll(value, state.language === "zh" ? "该主体" : "the subject"), text);
  }

  function renderAutopsy() {
    const item = cases.find((candidate) => candidate.id === state.labCaseId);
    if (!item) return;
    const copy = caseCopy(item);
    const clues = [copy.timeline.at(-1)?.body, copy.findings[0]?.body, copy.findings[1]?.body || copy.lesson].filter(Boolean);
    const correct = classifyCause(item);

    elements.labSubjectName.textContent = state.labAnswered ? item.name : t("subjectSealed").toUpperCase();
    elements.labSubjectFacts.innerHTML = `
      <div><dt>${escapeHtml(t("sector"))}</dt><dd>${escapeHtml(copy.sectorLabel)}</dd></div>
      <div><dt>${escapeHtml(t("location"))}</dt><dd>${escapeHtml(item.location)}</dd></div>
      <div><dt>${escapeHtml(t("eventDate"))}</dt><dd>${escapeHtml(item.eventDate || item.ceased)}</dd></div>
    `;
    elements.labStreak.textContent = String(state.labStreak);
    elements.labEvidence.innerHTML = clues.map((clue, index) => `
      <li><span>${escapeHtml(t("evidenceItem", { number: String(index + 1).padStart(2, "0") }))}</span><p>${escapeHtml(maskIdentity(clue, item))}</p></li>
    `).join("");
    elements.labOptions.innerHTML = `<legend>${escapeHtml(t("chooseCause"))}</legend>${causeKeys.map((key) => `
      <button type="button" data-cause="${key}" ${state.labAnswered ? "disabled" : ""} class="${state.labAnswered && key === correct ? "is-correct" : ""}">${escapeHtml(t(key))}</button>
    `).join("")}`;
    elements.labVerdict.hidden = !state.labAnswered;
    elements.openAutopsyFile.hidden = !state.labAnswered;
    elements.openAutopsyFile.dataset.openCase = item.id;
  }

  function startAutopsy() {
    const pool = cases.filter((item) => item.ceased === "2026" && caseCopy(item).findings?.length >= 2);
    const alternatives = pool.filter((item) => item.id !== state.labCaseId);
    const next = alternatives[Math.floor(Math.random() * alternatives.length)] || pool[0];
    if (!next) return;
    state.labCaseId = next.id;
    state.labAnswered = false;
    elements.labVerdict.hidden = true;
    elements.labVerdict.innerHTML = "";
    renderAutopsy();
  }

  function answerAutopsy(selected) {
    if (state.labAnswered) return;
    const item = cases.find((candidate) => candidate.id === state.labCaseId);
    if (!item) return;
    const correct = classifyCause(item);
    const isCorrect = selected === correct;
    state.labAnswered = true;
    state.labStreak = isCorrect ? state.labStreak + 1 : 0;
    localStorage.setItem("autopsy-streak", String(state.labStreak));
    renderAutopsy();
    const selectedButton = elements.labOptions.querySelector(`[data-cause="${selected}"]`);
    if (selectedButton && !isCorrect) selectedButton.classList.add("is-wrong");
    elements.labVerdict.className = `lab-verdict ${isCorrect ? "is-correct" : "is-wrong"}`;
    elements.labVerdict.innerHTML = `
      <span>${escapeHtml(t("identityRevealed"))}: ${escapeHtml(item.name)}</span>
      <strong>${escapeHtml(t(isCorrect ? "verdictCorrect" : "verdictWrong"))}</strong>
      <p>${escapeHtml(isCorrect ? t("verdictCorrectBody") : t("verdictWrongBody", { cause: t(correct) }))}</p>
    `;
  }

  function applyTranslations() {
    document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
    document.title = state.language === "zh" ? "Startup Autopsy | 创业失败档案馆" : "Startup Autopsy | An evidence-led archive of failure";
    document.querySelector('meta[name="description"]').content = state.language === "zh"
      ? "用公开证据还原创业公司停运、破产清算和产品下线的过程。"
      : "An evidence-led archive of startup shutdowns, bankruptcies, and product sunsets.";
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
    if (state.labCaseId) renderAutopsy();
  }

  function renderFilters() {
    const filters = ["all", "ai-app", "ai-companion", "robotics", "hardware", "autonomy", "health", "productivity", "ai-infra"];
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
    const filtered = cases.filter((item) => {
      const copy = caseCopy(item);
      const sectorMatch = state.sector === "all" || item.sector === state.sector;
      const yearMatch = state.year === "all" || (state.year === "historical" ? item.ceased !== "2026" : item.ceased === state.year);
      const regionMatch = state.region === "all" || item.region === state.region;
      const outcomeGroup = ["acqui-hire", "pivot", "liquidation", "other"];
      const outcomeMatch = state.outcome === "all" || item.outcome === state.outcome || (state.outcome === "other" && outcomeGroup.includes(item.outcome));
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
      return sectorMatch && yearMatch && regionMatch && outcomeMatch && (!normalized || searchText.includes(normalized));
    });
    return filtered.sort((a, b) => {
      if (state.sort === "name") return a.name.localeCompare(b.name, state.language === "zh" ? "zh-CN" : "en");
      const direction = state.sort === "oldest" ? 1 : -1;
      return String(a.eventDate).localeCompare(String(b.eventDate)) * direction;
    });
  }

  function renderSnapshot() {
    const current = cases.filter((item) => item.ceased === "2026");
    const stats = [
      [current.length, "statFiles"],
      [current.filter((item) => item.region === "china").length, "statChina"],
      [current.filter((item) => item.region === "global").length, "statGlobal"],
      [current.reduce((sum, item) => sum + caseCopy(item).sources.length, 0), "statSources"]
    ];
    elements.snapshotStats.innerHTML = stats.map(([value, key]) => `<div><dd>${value}</dd><dt>${escapeHtml(t(key))}</dt></div>`).join("");
  }

  function renderSkeletons() {
    elements.grid.setAttribute("aria-busy", "true");
    elements.grid.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card" aria-hidden="true"></div>').join("");
  }

  function renderCases() {
    const filtered = getFilteredCases();
    const hasFilters = state.sector !== "all" || state.year !== "all" || state.region !== "all" || state.outcome !== "all" || state.query.trim().length > 0;

    elements.resultCount.textContent = filtered.length === 1 ? t("resultSingle") : t("resultPlural", { count: String(filtered.length) });
    elements.reset.hidden = !hasFilters;
    elements.empty.hidden = filtered.length !== 0;
    elements.grid.hidden = filtered.length === 0;
    elements.grid.setAttribute("aria-busy", "false");

    elements.grid.innerHTML = filtered
      .map((item) => {
        const copy = caseCopy(item);
        return `
          <article class="case-card" data-case-id="${item.id}">
            <div>
              <div class="card-topline">
                <span class="card-status">${escapeHtml(copy.statusLabel)}</span>
                <span class="card-year">${escapeHtml(item.eventDate || item.ceased)}</span>
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
            <div class="card-actions">
              <button class="case-link" type="button" data-open-case="${item.id}">${escapeHtml(t("readFile"))}</button>
              <button class="compare-button" type="button" data-compare-id="${item.id}" aria-pressed="${String(state.compare.includes(item.id))}">${escapeHtml(t(state.compare.includes(item.id) ? "selected" : "compare"))}</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCompareTray() {
    elements.compareTray.hidden = state.compare.length === 0;
    elements.compareCount.textContent = t("compareCount", { count: String(state.compare.length) });
  }

  function toggleCompare(caseId) {
    if (state.compare.includes(caseId)) state.compare = state.compare.filter((id) => id !== caseId);
    else if (state.compare.length < 3) state.compare.push(caseId);
    renderCases();
    renderCompareTray();
  }

  function openCompare() {
    if (state.compare.length < 2) {
      elements.compareCount.textContent = t("compareNeedTwo");
      return;
    }
    const selected = state.compare.map((id) => cases.find((item) => item.id === id)).filter(Boolean);
    elements.compareDetail.innerHTML = `<div class="compare-grid">${selected.map((item) => {
      const copy = caseCopy(item);
      return `<article><p class="detail-record">${escapeHtml(item.eventDate)}</p><h3>${escapeHtml(item.name)}</h3><dl><div><dt>${escapeHtml(t("status"))}</dt><dd>${escapeHtml(copy.statusLabel)}</dd></div><div><dt>${escapeHtml(t("sector"))}</dt><dd>${escapeHtml(copy.sectorLabel)}</dd></div><div><dt>${escapeHtml(t("capital"))}</dt><dd>${escapeHtml(copy.capitalLabel || item.capital)}</dd></div></dl><h4>${escapeHtml(t("coreMechanism"))}</h4><p>${escapeHtml(copy.cause)}</p><h4>${escapeHtml(t("takeaway"))}</h4><p>${escapeHtml(copy.lesson)}</p><button class="case-link" type="button" data-open-case="${item.id}">${escapeHtml(t("readFile"))}</button></article>`;
    }).join("")}</div>`;
    elements.compareDialog.showModal();
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
    state.year = "all";
    state.region = "all";
    state.outcome = "all";
    elements.search.value = "";
    elements.yearFilter.value = "all";
    elements.regionFilter.value = "all";
    elements.outcomeFilter.value = "all";
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
    const caseTrigger = event.target.closest("[data-open-case]");
    if (caseTrigger) openCase(caseTrigger.dataset.openCase);
    const legacyCaseTrigger = event.target.closest("[data-case-id].case-link");
    if (legacyCaseTrigger) openCase(legacyCaseTrigger.dataset.caseId);

    const compareTrigger = event.target.closest("[data-compare-id]");
    if (compareTrigger) toggleCompare(compareTrigger.dataset.compareId);

    const causeTrigger = event.target.closest("[data-cause]");
    if (causeTrigger) answerAutopsy(causeTrigger.dataset.cause);

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
    if (event.target.closest("[data-close-compare]")) elements.compareDialog.close();
  });

  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCases();
  });

  [[elements.yearFilter, "year"], [elements.regionFilter, "region"], [elements.outcomeFilter, "outcome"], [elements.sortFilter, "sort"]].forEach(([element, key]) => {
    element.addEventListener("change", (event) => { state[key] = event.target.value; renderCases(); });
  });

  document.querySelector("#show-2026").addEventListener("click", () => {
    state.year = "2026";
    elements.yearFilter.value = "2026";
    renderCases();
    document.querySelector("#case-library").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  document.querySelector("#open-compare").addEventListener("click", openCompare);
  document.querySelector("#clear-compare").addEventListener("click", () => { state.compare = []; renderCases(); renderCompareTray(); });
  elements.nextAutopsy.addEventListener("click", startAutopsy);

  elements.reset.addEventListener("click", resetFilters);
  elements.emptyReset.addEventListener("click", resetFilters);

  elements.languageToggle.addEventListener("click", () => {
    state.language = state.language === "en" ? "zh" : "en";
    localStorage.setItem("autopsy-language", state.language);
    applyTranslations();
    renderFilters();
    renderCases();
    renderSnapshot();
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
  renderSnapshot();
  startAutopsy();
  renderFilters();
  renderSkeletons();
  window.setTimeout(renderCases, 360);

  const initialMatch = window.location.hash.match(/^#case=([a-z0-9-]+)$/);
  if (initialMatch) window.setTimeout(() => openCase(initialMatch[1], false), 380);
})();
