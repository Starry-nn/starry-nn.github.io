const skills = [
  {
    name: "monolith-daily-operations",
    title: "投资运营全流程",
    category: "投资研究",
    status: "installed",
    description: "把公开证据收集、实体建档、关系梳理和 Markdown/表格交付串成一套可复用流程。",
    when: "做公司深研、项目跟踪、投资组合更新或需要留下可复核的研究底稿时。",
    prompt: "使用 monolith-daily-operations skill，研究【公司/项目名称】。先确认任务范围，再收集公开证据，建立实体与关系档案，最后输出可复核的 Markdown 报告。",
    keywords: "公司研究 项目研究 投资组合 证据 实体 关系 交易 跟踪"
  },
  {
    name: "vc-company-summary",
    title: "公司投资摘要",
    category: "投资研究",
    status: "available",
    description: "将公司资料整理为投资人可读的摘要，覆盖融资、团队、产品、竞争和公开联系方式。",
    when: "刚拿到一个公司名称、IT 桔子或鲸准页面，需要快速形成项目卡片时。",
    prompt: "使用 vc-company-summary skill，整理【公司名称或链接】。重点覆盖成立时间、融资、创始人、产品、竞争格局和可验证来源。",
    keywords: "公司 项目卡 融资 创始人 竞品 IT桔子 鲸准"
  },
  {
    name: "data-analytics:market-sizing",
    title: "市场规模测算",
    category: "投资研究",
    status: "available",
    description: "用透明假设估算市场、细分赛道或机会规模，并区分 TAM、SAM 和 SOM。",
    when: "判断陌生赛道空间、验证 BP 市场数字或准备投委会材料时。",
    prompt: "使用 data-analytics:market-sizing skill，测算【赛道】的 TAM、SAM 和 SOM。列出每个假设、计算路径、数据来源与敏感性。",
    keywords: "市场规模 TAM SAM SOM 赛道 行业 BP"
  },
  {
    name: "data-analytics:product-business-analysis",
    title: "产品与商业分析",
    category: "投资研究",
    status: "available",
    description: "围绕产品表现、商业驱动因素和决策问题做结构化分析，给出证据支持的建议。",
    when: "需要比较业务质量、拆解增长来源或判断产品策略是否成立时。",
    prompt: "使用 data-analytics:product-business-analysis skill，分析【公司/产品】的商业模式、增长驱动、留存与主要风险，并给出下一步验证清单。",
    keywords: "产品 商业模式 增长 留存 风险 业务分析"
  },
  {
    name: "data-analytics:metric-diagnostics",
    title: "指标异常诊断",
    category: "投资研究",
    status: "available",
    description: "解释指标为什么变化或偏离预期，区分数据问题、结构变化和真实业务变化。",
    when: "投后月报数字异常、经营指标下滑或两个口径对不上时。",
    prompt: "使用 data-analytics:metric-diagnostics skill，诊断【指标】在【时间范围】的变化。先核对口径，再拆解驱动因素并给出验证方法。",
    keywords: "指标 诊断 月报 投后 异常 口径 经营"
  },
  {
    name: "data-analytics:analyze-data-quality",
    title: "数据质量审计",
    category: "数据与人才库",
    status: "available",
    description: "检查结构化数据、查询结果或分析证据的完整性、一致性和可用性。",
    when: "人才库、公司库出现重复、缺字段、来源失效或名称质量问题时。",
    prompt: "使用 data-analytics:analyze-data-quality skill，审计【文件/表格】。检查重复、缺失、格式、口径和来源完整性，并输出修复优先级。",
    keywords: "数据质量 人才库 公司库 重复 缺失 来源 清洗"
  },
  {
    name: "lark-base",
    title: "飞书多维表格",
    category: "数据与人才库",
    status: "available",
    description: "管理 Base 的表、字段、记录、视图、公式、仪表盘、工作流和权限。",
    when: "维护 AI 人才库、项目库、来源 Kanban 或批量更新字段时。",
    prompt: "使用 lark-base skill，打开【Base 链接】。先读取表结构，再按【具体目标】处理记录，并在写入后抽样核验。",
    keywords: "飞书 Base 多维表格 人才库 项目库 字段 记录 看板"
  },
  {
    name: "lark-sheets",
    title: "飞书电子表格",
    category: "数据与人才库",
    status: "available",
    description: "创建和维护飞书表格，支持公式、样式、批注、结构调整和精确范围读写。",
    when: "整理公司清单、人物 mapping、投资组合或需要协作编辑的分析表时。",
    prompt: "使用 lark-sheets skill，处理【表格链接】。目标是【任务】。先确认工作表与范围，再修改并复核公式和关键单元格。",
    keywords: "飞书 表格 Excel mapping 清单 公司 人物 公式"
  },
  {
    name: "spreadsheets:Spreadsheets",
    title: "独立表格分析",
    category: "数据与人才库",
    status: "available",
    description: "创建、编辑、分析和验证本地 Excel 或 CSV 文件，适合形成可交付的数据文件。",
    when: "需要本地批量清洗、公式计算、格式化或导出最终 Excel 时。",
    prompt: "使用 spreadsheets:Spreadsheets skill，分析【文件】。完成【清洗/计算/格式化目标】，保留原始数据，并验证关键结果。",
    keywords: "Excel CSV 表格 分析 清洗 公式 导出"
  },
  {
    name: "data-analytics:validate-data",
    title: "分析结果核验",
    category: "数据与人才库",
    status: "available",
    description: "验证分析是否准确、有证据支持并达到可分享标准，重点抓口径和推理漏洞。",
    when: "准备把研究、名单或数据结论交给团队之前做最后复核时。",
    prompt: "使用 data-analytics:validate-data skill，核验【分析文件】。逐项检查数据来源、计算、口径、结论强度和无法支持的表述。",
    keywords: "验证 QA 数据 结论 来源 计算 复核"
  },
  {
    name: "lark-minutes",
    title: "飞书妙记整理",
    category: "会议与协作",
    status: "available",
    description: "搜索和读取飞书妙记，处理逐字稿、说话人、关键词及相关音视频产物。",
    when: "投资访谈、团队会议或活动结束后，需要从妙记提取完整内容时。",
    prompt: "使用 lark-minutes skill，读取【妙记链接/会议信息】。整理关键观点、事实、分歧、待办和原话证据，并标注说话人。",
    keywords: "飞书 妙记 会议 访谈 逐字稿 说话人 待办"
  },
  {
    name: "lark-workflow-meeting-summary",
    title: "会议纪要周报",
    category: "会议与协作",
    status: "available",
    description: "汇总指定时间范围内的会议纪要，并生成结构化回顾或会议周报。",
    when: "周末回顾本周访谈和会议，或集中提取跨会议结论与待办时。",
    prompt: "使用 lark-workflow-meeting-summary skill，汇总【日期范围】内的会议。按主题归纳结论、争议、行动项和负责人。",
    keywords: "会议 周报 回顾 汇总 待办 日期 飞书"
  },
  {
    name: "lark-calendar",
    title: "日历与会议安排",
    category: "会议与协作",
    status: "available",
    description: "查看和管理飞书日程、参会人、忙闲与会议室，支持推荐合适时段。",
    when: "安排访谈、协调多人时间、查询空档或预定会议室时。",
    prompt: "使用 lark-calendar skill，帮我安排【会议主题】。参与人是【姓名】，时长【分钟】，优先考虑【日期/时间范围】。",
    keywords: "日历 日程 会议室 忙闲 安排 访谈"
  },
  {
    name: "lark-contact",
    title: "飞书联系人解析",
    category: "会议与协作",
    status: "available",
    description: "按姓名或邮箱解析联系人身份，也可反查部门、邮箱和公开联系方式。",
    when: "给协作者发文档、建群、安排会议或需要确认同名联系人时。",
    prompt: "使用 lark-contact skill，查找【姓名/邮箱】对应的飞书联系人，并返回姓名、部门和可用身份信息。",
    keywords: "飞书 联系人 姓名 邮箱 部门 open_id"
  },
  {
    name: "lark-im",
    title: "飞书消息与群聊",
    category: "会议与协作",
    status: "available",
    description: "搜索聊天记录、发送和回复消息、管理群聊成员及上传下载附件。",
    when: "追溯项目讨论、向同事同步结果或在群里分发报告时。",
    prompt: "使用 lark-im skill，在【聊天/群组】中查找关于【主题】的讨论，整理结论。不要发送消息，除非我明确确认内容。",
    keywords: "飞书 消息 群聊 搜索 讨论 同步 文件"
  },
  {
    name: "lark-workflow-standup-report",
    title: "今日工作摘要",
    category: "会议与协作",
    status: "available",
    description: "组合日历和任务，生成指定日期的日程、未完成事项和工作重点摘要。",
    when: "每天开始工作前排优先级，或结束时快速回顾遗留事项。",
    prompt: "使用 lark-workflow-standup-report skill，整理【日期】的日程和未完成任务，按紧急程度给出今天的执行顺序。",
    keywords: "今日 日程 待办 站会 优先级 工作摘要"
  },
  {
    name: "lark-doc",
    title: "飞书文档读写",
    category: "内容交付",
    status: "available",
    description: "读取、创建和编辑飞书 Docx 或 Wiki 文档，可插入结构化内容和附件。",
    when: "把研究结果、会议纪要或 SOP 沉淀为团队可协作的飞书文档时。",
    prompt: "使用 lark-doc skill，读取【文档链接】并按【目标】更新。保持原有结构，写入后再次读取关键段落核验。",
    keywords: "飞书 文档 Docx Wiki 写作 编辑 报告 SOP"
  },
  {
    name: "documents:documents",
    title: "Word 文档交付",
    category: "内容交付",
    status: "available",
    description: "创建、编辑、批注和校对 Word 文档，适合需要正式版式的对外交付。",
    when: "输出投资报告、访谈整理稿、申请材料或需要红线修改的 .docx 时。",
    prompt: "使用 documents:documents skill，把【材料】整理成正式 Word 文档。保留事实与来源，优化结构和版式，并检查分页与标题层级。",
    keywords: "Word docx 报告 红线 批注 排版 交付"
  },
  {
    name: "pdf",
    title: "PDF 阅读与核验",
    category: "内容交付",
    status: "installed",
    description: "读取、创建、渲染和检查 PDF，兼顾内容提取与实际页面视觉效果。",
    when: "读 BP、论文、招股书、简历，或交付前检查 PDF 是否缺页和错版时。",
    prompt: "使用 pdf skill，读取【PDF 文件】。提取与【问题】有关的证据和页码，并检查表格、图片及页面布局。",
    keywords: "PDF BP 论文 招股书 简历 渲染 页码"
  },
  {
    name: "presentations:Presentations",
    title: "演示文稿制作",
    category: "内容交付",
    status: "available",
    description: "读取、创建和编辑 PowerPoint 或 Google Slides，适合汇报与活动演示。",
    when: "制作投委会材料、项目路演、论坛海报内容或内部分享时。",
    prompt: "使用 presentations:Presentations skill，基于【材料】制作【页数】页演示文稿，受众是【对象】。先给结构，再完成排版并做视觉检查。",
    keywords: "PPT Slides 投委会 路演 汇报 演示"
  },
  {
    name: "data-analytics:build-report",
    title: "分析报告生成",
    category: "内容交付",
    status: "available",
    description: "把数据和证据整理成适合管理层、产品或投资场景的正式分析报告。",
    when: "从零散研究和表格形成一份有结论、有图表、有建议的完整报告时。",
    prompt: "使用 data-analytics:build-report skill，把【资料】整理成面向【受众】的报告。突出关键结论、证据、风险和下一步行动。",
    keywords: "报告 分析 管理层 投资 结论 图表 建议"
  },
  {
    name: "data-analytics:visualize-data",
    title: "数据可视化",
    category: "内容交付",
    status: "available",
    description: "设计、制作和检查定量图表，选择最能解释关系与变化的视觉形式。",
    when: "报告或 PPT 里需要趋势图、对比图、结构图，并希望避免误导时。",
    prompt: "使用 data-analytics:visualize-data skill，为【数据/结论】选择并制作合适图表。标清口径、单位和来源，并检查可读性。",
    keywords: "图表 可视化 趋势 对比 PPT 报告"
  },
  {
    name: "elsewhere-news",
    title: "一手新闻研究",
    category: "情报与周报",
    status: "installed",
    description: "阅读和分析 Elsewhere 上的原创一手报道，适合补充事件现场与人物视角。",
    when: "研究 AI 公司、创始人、实验室动态或需要区别二手转载与一手信息时。",
    prompt: "使用 elsewhere-news skill，查找与【主题/人物/公司】相关的一手报道，提取关键事实、原话背景和可能的投资含义。",
    keywords: "新闻 一手 信息 AI 公司 创始人 Elsewhere"
  },
  {
    name: "prompt-task-router",
    title: "Prompt 路由与复用",
    category: "自动化与工具",
    status: "installed",
    description: "保存、分类、比较、检索和调用可复用 Prompt，减少重复描述相似任务。",
    when: "同一种研究、公司卡片、人物 mapping 或周报任务反复出现时。",
    prompt: "使用 prompt-task-router skill，查找最适合【任务】的已保存 Prompt。先展示候选和差异，再调用我确认的版本。",
    keywords: "Prompt 提示词 保存 检索 复用 路由 工作流"
  },
  {
    name: "skill-creator",
    title: "创建新 Skill",
    category: "自动化与工具",
    status: "installed",
    description: "把稳定、重复、多步骤的工作方式封装成 Codex 可持续复用的 Skill。",
    when: "一个流程已经做过三次以上，步骤稳定，并希望以后用一句话启动时。",
    prompt: "使用 skill-creator skill，把【流程描述】封装成一个可复用 Skill。先梳理触发条件、输入输出、验证方式和需要保留的资源。",
    keywords: "创建 Skill 自动化 SOP 封装 复用"
  },
  {
    name: "lark-task",
    title: "飞书任务管理",
    category: "自动化与工具",
    status: "available",
    description: "创建、查看和更新任务，拆分子任务、分配协作者并维护任务清单。",
    when: "把会议行动项、研究计划或项目跟进转成明确负责人和截止时间时。",
    prompt: "使用 lark-task skill，把以下行动项整理为任务：【内容】。补齐负责人、截止时间、优先级和验收标准，创建前先给我确认。",
    keywords: "飞书 任务 待办 行动项 负责人 截止时间"
  },
  {
    name: "frontend-design",
    title: "前端页面设计",
    category: "自动化与工具",
    status: "installed",
    description: "为新页面建立清晰、有辨识度且可落地的前端视觉与交互方向。",
    when: "搭建个人网站、研究产品页、周报站点或需要改造静态页面时。",
    prompt: "使用 frontend-design skill，设计并实现【页面目标】。优先信息可达性、响应式与可访问性，沿用现有技术栈。",
    keywords: "网站 前端 页面 UI 设计 响应式 GitHub Pages"
  },
  {
    name: "imagegen",
    title: "图片生成与编辑",
    category: "自动化与工具",
    status: "installed",
    description: "生成或编辑位图，用于海报、人物视觉、网站配图和社交媒体素材。",
    when: "需要活动海报、概念视觉、页面首图，或修改已有图片中的元素时。",
    prompt: "使用 imagegen skill，为【用途】生成一张【尺寸/比例】图片。视觉方向是【描述】，文字区域需要【留白要求】。",
    keywords: "图片 海报 视觉 配图 编辑 生成 社交媒体"
  },
  {
    name: "lark-markdown",
    title: "飞书 Markdown 管理",
    category: "内容交付",
    status: "available",
    description: "查看、创建、上传、编辑和比较 Markdown 文件，适合结构化研究材料。",
    when: "需要在飞书内维护 Markdown 报告、局部补丁或比较两个研究版本时。",
    prompt: "使用 lark-markdown skill，读取【Markdown 文件/链接】并完成【编辑目标】。保留结构，只修改相关段落并给出差异。",
    keywords: "飞书 Markdown md 编辑 比较 报告"
  },
  {
    name: "data-analytics:kpi-reporting",
    title: "KPI 周报与月报",
    category: "情报与周报",
    status: "available",
    description: "制作 KPI 读数、周报、月报和管理层摘要，突出目标、变化和异常。",
    when: "做投后跟踪、组合公司经营回顾或周期性业务复盘时。",
    prompt: "使用 data-analytics:kpi-reporting skill，基于【数据】生成【周报/月报】。对比目标和上期，标出异常、原因与行动项。",
    keywords: "KPI 周报 月报 投后 经营 复盘"
  },
  {
    name: "lark-mail",
    title: "飞书邮件",
    category: "会议与协作",
    status: "available",
    description: "搜索、阅读、起草、回复和转发飞书邮件，支持文件夹与附件操作。",
    when: "整理外部联系、起草访谈邀请或从邮件中追溯项目资料时。",
    prompt: "使用 lark-mail skill，搜索与【主题/联系人】有关的邮件并摘要。不要发送或回复，除非我明确确认最终内容。",
    keywords: "飞书 邮件 联系人 访谈 邀请 搜索 附件"
  }
];

const workflows = [
  {
    title: "研究一家公司",
    description: "从公司卡片到商业模式、行业空间、关键人物和公开证据。",
    query: "公司"
  },
  {
    title: "做人物与团队 Mapping",
    description: "找人、核验履历、整理贡献关系，再写入飞书人才库。",
    query: "人物 mapping"
  },
  {
    title: "整理会议与访谈",
    description: "读取妙记，区分事实和判断，提取原话、分歧与行动项。",
    query: "会议"
  },
  {
    title: "维护数据与人才库",
    description: "审计重复和缺失，批量更新字段，最后抽样验证结果。",
    query: "人才库"
  },
  {
    title: "交付报告与演示",
    description: "把研究底稿转成 Word、PDF、图表或可讲述的演示文稿。",
    query: "报告"
  },
  {
    title: "做周报与日常复盘",
    description: "组合新闻、会议、任务和 KPI，形成每天或每周的工作视图。",
    query: "周报"
  }
];

const categoryOrder = ["全部", "投资研究", "数据与人才库", "会议与协作", "内容交付", "情报与周报", "自动化与工具"];

const state = {
  query: "",
  category: "全部",
  status: "all"
};

const elements = {
  search: document.querySelector("#searchInput"),
  clear: document.querySelector("#clearSearch"),
  list: document.querySelector("#skillsList"),
  summary: document.querySelector("#resultSummary"),
  categoryFilters: document.querySelector("#categoryFilters"),
  workflowGrid: document.querySelector("#workflowGrid"),
  empty: document.querySelector("#emptyState"),
  toast: document.querySelector("#toast"),
  themeButton: document.querySelector("#themeButton")
};

function normalize(value) {
  return value.toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").trim();
}

function matchesQuery(skill, query) {
  if (!query) return true;
  const words = normalize(query).split(" ").filter(Boolean);
  const haystack = normalize([skill.title, skill.name, skill.category, skill.description, skill.when, skill.keywords].join(" "));
  return words.every(word => haystack.includes(word));
}

function filteredSkills() {
  return skills.filter(skill => {
    const categoryMatch = state.category === "全部" || skill.category === state.category;
    const statusMatch = state.status === "all" || skill.status === state.status;
    return categoryMatch && statusMatch && matchesQuery(skill, state.query);
  });
}

function renderWorkflows() {
  elements.workflowGrid.innerHTML = workflows.map(workflow => {
    const count = skills.filter(skill => matchesQuery(skill, workflow.query)).length;
    return `
    <button class="workflow-card" type="button" data-workflow-query="${workflow.query}">
      <span>
        <h3>${workflow.title}</h3>
        <p>${workflow.description}</p>
      </span>
      <span class="workflow-meta">
        <span>${count} 个相关 Skills</span>
        <span aria-hidden="true">↗</span>
      </span>
    </button>
  `;
  }).join("");
}

function renderCategoryFilters() {
  elements.categoryFilters.innerHTML = categoryOrder.map(category => `
    <button class="filter-button${state.category === category ? " active" : ""}" type="button" data-category="${category}" aria-pressed="${state.category === category}">
      ${category}
    </button>
  `).join("");
}

function renderSkills() {
  const matches = filteredSkills();
  elements.summary.textContent = state.query || state.category !== "全部" || state.status !== "all"
    ? `找到 ${matches.length} 个匹配项`
    : `为你的日常工作精选 ${skills.length} 个 Skills`;
  elements.empty.hidden = matches.length !== 0;
  elements.list.hidden = matches.length === 0;
  elements.list.innerHTML = matches.map((skill, index) => `
    <article class="skill-card">
      <div class="skill-top">
        <span class="skill-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="status ${skill.status}">${skill.status === "installed" ? "本地已安装" : "当前可用"}</span>
      </div>
      <div>
        <h3>${skill.title}</h3>
        <p class="skill-category">${skill.category}</p>
      </div>
      <div>
        <p class="skill-description">${skill.description}</p>
        <p class="skill-when"><strong>什么时候用</strong>${skill.when}</p>
      </div>
      <div class="skill-footer">
        <span class="skill-name">${skill.name}</span>
        <button class="copy-button" type="button" data-skill-name="${skill.name}">复制调用语</button>
      </div>
    </article>
  `).join("");
}

function render() {
  renderCategoryFilters();
  renderSkills();
  document.querySelectorAll("[data-status]").forEach(button => {
    const active = button.dataset.status === state.status;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyQuery(query, shouldScroll = false) {
  state.query = query;
  elements.search.value = query;
  renderSkills();
  if (shouldScroll) document.querySelector("#library").scrollIntoView({ behavior: "smooth", block: "start" });
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

async function copyPrompt(skillName) {
  const skill = skills.find(item => item.name === skillName);
  if (!skill) return;
  try {
    await navigator.clipboard.writeText(skill.prompt);
    showToast(`已复制「${skill.title}」调用语`);
  } catch (error) {
    const fallback = document.createElement("textarea");
    fallback.value = skill.prompt;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    fallback.remove();
    showToast(`已复制「${skill.title}」调用语`);
  }
}

function resetAll() {
  state.query = "";
  state.category = "全部";
  state.status = "all";
  elements.search.value = "";
  render();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("skills-desk-theme", theme);
  elements.themeButton.textContent = theme === "dark" ? "浅色模式" : "深色模式";
}

function initializeTheme() {
  const saved = localStorage.getItem("skills-desk-theme");
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved || preferred);
}

elements.search.addEventListener("input", event => applyQuery(event.target.value));
elements.clear.addEventListener("click", resetAll);
document.querySelector("#resetFilters").addEventListener("click", resetAll);
document.querySelector("#emptyReset").addEventListener("click", resetAll);

document.addEventListener("click", event => {
  const categoryButton = event.target.closest("[data-category]");
  const statusButton = event.target.closest("[data-status]");
  const workflowButton = event.target.closest("[data-workflow-query]");
  const hotButton = event.target.closest("[data-query]");
  const copyButton = event.target.closest("[data-skill-name]");

  if (categoryButton) {
    state.category = categoryButton.dataset.category;
    render();
  }
  if (statusButton) {
    state.status = statusButton.dataset.status;
    render();
  }
  if (workflowButton) applyQuery(workflowButton.dataset.workflowQuery, true);
  if (hotButton) applyQuery(hotButton.dataset.query, true);
  if (copyButton) copyPrompt(copyButton.dataset.skillName);
});

document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement !== elements.search) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape") resetAll();
});

elements.themeButton.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

initializeTheme();
renderWorkflows();
render();
