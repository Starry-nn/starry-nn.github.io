window.AUTOPSY_CASES = [
  {
    id: "argo-ai",
    name: "Argo AI",
    monogram: "A",
    founded: "2016",
    ceased: "2022",
    sector: "autonomy",
    peakValue: "$7B+",
    capital: "$3.6B committed",
    location: "Pittsburgh, US",
    status: "Wound down",
    confidence: "High",
    accent: "graphite",
    causeTags: ["capital intensity", "long horizon", "investor dependency"],
    en: {
      sectorLabel: "Autonomous driving",
      statusLabel: "Wound down",
      capitalLabel: "$3.6B committed",
      summary:
        "Ford and Volkswagen backed an ambitious Level 4 autonomy program, then redirected capital toward nearer-term driver assistance as commercial deployment remained distant.",
      cause:
        "A long commercialization horizon collided with extreme capital needs and dependence on two strategic backers.",
      lesson:
        "When strategic investors are also the route to market, a shift in their priorities can become an existential product risk.",
      timeline: [
        { year: "2017", title: "Ford commits $1 billion", body: "Ford announces a five-year investment and becomes Argo AI's majority owner." },
        { year: "2020", title: "Volkswagen joins", body: "Volkswagen commits $2.6 billion in cash and assets. The transaction values Argo AI above $7 billion." },
        { year: "2022", title: "The strategy changes", body: "Ford redirects spending from Level 4 autonomy toward internally developed Level 2 and Level 3 systems." },
        { year: "2022", title: "Operations wind down", body: "Ford and Volkswagen initiate an exit from joint Level 4 development through Argo AI." }
      ],
      findings: [
        { type: "fact", title: "Concentrated strategic backing", body: "Ford and Volkswagen together held the majority interest and supplied the central commercialization path." },
        { type: "fact", title: "A distant path to profit", body: "Ford said profitable fully autonomous vehicles at scale were still a long way off." },
        { type: "inference", title: "The product horizon exceeded the patience horizon", body: "The technology could continue to improve while still losing the internal competition for capital." }
      ],
      sources: [
        { label: "Ford Q3 2022 filing", publisher: "SEC", date: "2022-10", url: "https://www.sec.gov/Archives/edgar/data/37996/000003799622000073/f-20220930.htm", primary: true },
        { label: "Ford and Volkswagen expand collaboration", publisher: "Volkswagen Group", date: "2019-07", url: "https://www.volkswagen-group.com/en/press-releases/ford-volkswagen-expand-their-global-collaboration-to-advance-autonomous-driving-electrification-and-better-serve-customers-16636", primary: true },
        { label: "Ford and VW pullout dooms Argo AI", publisher: "Axios", date: "2022-10", url: "https://www.axios.com/2022/10/26/argo-ai-ford-volkswagen-self-driving", primary: false }
      ]
    },
    zh: {
      sectorLabel: "自动驾驶",
      statusLabel: "停止运营",
      capitalLabel: "$3.6B 承诺投入",
      summary: "福特与大众共同押注 L4 自动驾驶，但在商业化仍然遥远时，将资本转向更接近落地的辅助驾驶技术。",
      cause: "漫长的商业化周期、极高的资金需求，以及对两家战略投资方的高度依赖同时发生。",
      lesson: "当战略投资方也是主要商业化渠道时，对方的优先级变化本身就是产品的生存风险。",
      timeline: [
        { year: "2017", title: "福特承诺投资 10 亿美元", body: "福特宣布五年投资计划，并成为 Argo AI 的大股东。" },
        { year: "2020", title: "大众加入", body: "大众以现金和资产承诺投入 26 亿美元，交易对 Argo AI 的估值超过 70 亿美元。" },
        { year: "2022", title: "战略方向改变", body: "福特把投入从 L4 自动驾驶转向内部开发的 L2 和 L3 系统。" },
        { year: "2022", title: "公司停止运营", body: "福特与大众启动退出通过 Argo AI 联合开发 L4 技术的流程。" }
      ],
      findings: [
        { type: "fact", title: "战略资金高度集中", body: "福特与大众合计持有多数权益，也是主要的商业化路径。" },
        { type: "fact", title: "盈利时间仍然遥远", body: "福特表示，大规模盈利的完全自动驾驶汽车仍然需要很长时间。" },
        { type: "inference", title: "产品周期超过耐心周期", body: "技术可以持续进步，却仍可能在内部资本分配中失去优先级。" }
      ],
      sources: [
        { label: "福特 2022 年第三季度文件", publisher: "美国证监会", date: "2022-10", url: "https://www.sec.gov/Archives/edgar/data/37996/000003799622000073/f-20220930.htm", primary: true },
        { label: "福特与大众扩大合作", publisher: "Volkswagen Group", date: "2019-07", url: "https://www.volkswagen-group.com/en/press-releases/ford-volkswagen-expand-their-global-collaboration-to-advance-autonomous-driving-electrification-and-better-serve-customers-16636", primary: true },
        { label: "福特与大众撤资后 Argo AI 关闭", publisher: "Axios", date: "2022-10", url: "https://www.axios.com/2022/10/26/argo-ai-ford-volkswagen-self-driving", primary: false }
      ]
    }
  },
  {
    id: "olive-ai",
    name: "Olive AI",
    monogram: "O",
    founded: "2012",
    ceased: "2023",
    sector: "health",
    peakValue: "$4B",
    capital: "$902M raised",
    location: "Columbus, US",
    status: "Assets sold",
    confidence: "High",
    accent: "red",
    causeTags: ["loss of focus", "hypergrowth", "integration burden"],
    en: {
      sectorLabel: "Healthcare automation",
      statusLabel: "Assets sold and wound down",
      capitalLabel: "$902M raised",
      summary: "Olive promised an AI workforce for healthcare administration, scaled across hundreds of hospitals, then sold its remaining business lines and wound down.",
      cause: "Rapid expansion across products strained execution before durable focus and customer value were fully established.",
      lesson: "Enterprise adoption counts can look impressive while implementation burden, retention, and provable ROI remain unresolved.",
      timeline: [
        { year: "2020", title: "Valuation reaches $1.5 billion", body: "A $225 million round accelerates expansion during the digital-health funding boom." },
        { year: "2021", title: "Olive reaches a $4 billion valuation", body: "A $400 million round brings reported total financing since inception to $902 million." },
        { year: "2022", title: "450 roles are cut", body: "The CEO points to market conditions and strategic missteps, including fast growth and lack of focus." },
        { year: "2023", title: "Remaining units are sold", body: "After multiple asset sales and further layoffs, Olive winds down operations." }
      ],
      findings: [
        { type: "fact", title: "Expansion outpaced focus", body: "Olive's CEO said fast growth and lack of focus strained product and engineering resources." },
        { type: "fact", title: "The wind-down followed asset sales", body: "Business lines were sold in stages before the remaining operations closed." },
        { type: "inference", title: "Distribution did not guarantee durable value", body: "A large footprint across hospitals did not protect the company from execution and retention pressure." }
      ],
      sources: [
        { label: "Olive announces $400 million round", publisher: "Olive via PR Newswire", date: "2021-07", url: "https://www.prnewswire.com/news-releases/olive-hits-a-4-billion-valuation-with-400-million-of-capital-led-by-vista-equity-partners-301323850.html", primary: true },
        { label: "Olive sells units and winds down", publisher: "Fierce Healthcare", date: "2023-10", url: "https://www.fiercehealthcare.com/health-tech/once-high-flying-unicorn-olive-ai-sells-two-key-businesses-winds-down-operations", primary: false },
        { label: "Olive AI is shutting down", publisher: "Axios", date: "2023-10", url: "https://www.axios.com/pro/health-tech-deals/2023/10/31/olive-ai-is-shutting-down", primary: false }
      ]
    },
    zh: {
      sectorLabel: "医疗自动化",
      statusLabel: "出售资产并停止运营",
      capitalLabel: "$902M 融资",
      summary: "Olive 希望为医疗行政工作提供 AI 劳动力，快速进入数百家医院，最终出售剩余业务并停止运营。",
      cause: "产品线快速扩张消耗了执行能力，而明确的业务聚焦与可持续客户价值尚未完全建立。",
      lesson: "企业客户数量看起来很亮眼，但实施成本、留存和可验证的投资回报仍可能没有解决。",
      timeline: [
        { year: "2020", title: "估值达到 15 亿美元", body: "在数字医疗融资热潮中，公司通过 2.25 亿美元融资加速扩张。" },
        { year: "2021", title: "估值达到 40 亿美元", body: "4 亿美元新融资使公司成立以来披露的融资总额达到 9.02 亿美元。" },
        { year: "2022", title: "裁员 450 人", body: "CEO 提到市场环境和战略失误，包括增长过快与缺乏聚焦。" },
        { year: "2023", title: "出售剩余业务", body: "经历多次资产出售和进一步裁员后，Olive 停止运营。" }
      ],
      findings: [
        { type: "fact", title: "扩张速度超过聚焦能力", body: "Olive CEO 表示，快速增长与缺乏聚焦给产品和工程资源造成压力。" },
        { type: "fact", title: "停止运营之前分批出售资产", body: "公司先后出售多条业务线，随后关闭剩余运营。" },
        { type: "inference", title: "广泛部署不等于持久价值", body: "覆盖大量医院并没有让公司免于执行和留存压力。" }
      ],
      sources: [
        { label: "Olive 宣布 4 亿美元融资", publisher: "Olive via PR Newswire", date: "2021-07", url: "https://www.prnewswire.com/news-releases/olive-hits-a-4-billion-valuation-with-400-million-of-capital-led-by-vista-equity-partners-301323850.html", primary: true },
        { label: "Olive 出售业务并停止运营", publisher: "Fierce Healthcare", date: "2023-10", url: "https://www.fiercehealthcare.com/health-tech/once-high-flying-unicorn-olive-ai-sells-two-key-businesses-winds-down-operations", primary: false },
        { label: "Olive AI 即将关闭", publisher: "Axios", date: "2023-10", url: "https://www.axios.com/pro/health-tech-deals/2023/10/31/olive-ai-is-shutting-down", primary: false }
      ]
    }
  },
  {
    id: "babylon-health",
    name: "Babylon Health",
    monogram: "B",
    founded: "2013",
    ceased: "2023",
    sector: "health",
    peakValue: "$4.2B SPAC",
    capital: "Public company",
    location: "London, UK",
    status: "Bankruptcy and sale",
    confidence: "High",
    accent: "graphite",
    causeTags: ["care economics", "public markets", "complex operations"],
    en: {
      sectorLabel: "Digital health",
      statusLabel: "Bankruptcy and asset sale",
      capitalLabel: "Public company",
      summary: "Babylon combined an AI symptom checker, virtual care, and value-based healthcare before its planned rescue transaction failed and core assets were sold.",
      cause: "Complex care economics and heavy operating demands met public-market pressure and a failed rescue transaction.",
      lesson: "A compelling consumer interface does not simplify the underlying economics of delivering and underwriting healthcare.",
      timeline: [
        { year: "2021", title: "Babylon goes public", body: "The SPAC transaction implies an equity value of roughly $4.2 billion." },
        { year: "2023", title: "A take-private plan is proposed", body: "Babylon pursues a transaction backed by MindMaze and AlbaCore." },
        { year: "2023", title: "The transaction collapses", body: "The proposed deal does not proceed. Babylon begins exiting its core US business." },
        { year: "2023", title: "Assets are sold", body: "Most UK assets are sold to eMed while remaining parts enter wind-down or bankruptcy processes." }
      ],
      findings: [
        { type: "fact", title: "The rescue transaction failed", body: "Babylon disclosed that its previously announced take-private transaction would not proceed." },
        { type: "fact", title: "The business was split during the wind-down", body: "UK assets were sold while parts of the US business entered Chapter 7 proceedings." },
        { type: "inference", title: "Software simplicity hid operational complexity", body: "The clean promise of digital-first care sat on top of regulated, capital-intensive service delivery." }
      ],
      sources: [
        { label: "Babylon strategic update", publisher: "SEC", date: "2023-08", url: "https://www.sec.gov/Archives/edgar/data/1866390/000110465923097308/tm2325256d1_8k.htm", primary: true },
        { label: "Babylon sells UK business", publisher: "Healthcare Dive", date: "2023-09", url: "https://www.healthcaredive.com/news/Babylon-Chapter-7-bankruptcy/691218/", primary: false },
        { label: "Behind the fall of Babylon", publisher: "Axios", date: "2023-09", url: "https://www.axios.com/2023/09/04/babylon-health-emed-bankruptcy", primary: false }
      ]
    },
    zh: {
      sectorLabel: "数字医疗",
      statusLabel: "破产并出售资产",
      capitalLabel: "上市公司",
      summary: "Babylon 将 AI 症状检查、远程医疗和价值医疗结合在一起，但救助交易失败后，其核心资产被出售。",
      cause: "复杂的医疗经济模型和沉重运营需求，同时遭遇公开市场压力与救助交易失败。",
      lesson: "优秀的消费者界面并不能简化医疗服务交付和风险承担背后的复杂经济模型。",
      timeline: [
        { year: "2021", title: "Babylon 上市", body: "SPAC 交易对应的股权价值约为 42 亿美元。" },
        { year: "2023", title: "提出私有化方案", body: "Babylon 推进由 MindMaze 和 AlbaCore 支持的交易。" },
        { year: "2023", title: "交易失败", body: "此前宣布的交易未能继续，公司开始退出美国核心业务。" },
        { year: "2023", title: "资产被出售", body: "大部分英国资产出售给 eMed，其余部分进入停止运营或破产程序。" }
      ],
      findings: [
        { type: "fact", title: "救助交易失败", body: "Babylon 披露，此前宣布的私有化交易不会继续。" },
        { type: "fact", title: "停止运营时业务被拆分", body: "英国资产被出售，美国部分业务进入美国破产法第七章程序。" },
        { type: "inference", title: "软件的简单掩盖了运营的复杂", body: "数字优先医疗的简洁承诺建立在受监管、高资本需求的服务交付之上。" }
      ],
      sources: [
        { label: "Babylon 战略更新", publisher: "美国证监会", date: "2023-08", url: "https://www.sec.gov/Archives/edgar/data/1866390/000110465923097308/tm2325256d1_8k.htm", primary: true },
        { label: "Babylon 出售英国业务", publisher: "Healthcare Dive", date: "2023-09", url: "https://www.healthcaredive.com/news/Babylon-Chapter-7-bankruptcy/691218/", primary: false },
        { label: "Babylon 的衰落", publisher: "Axios", date: "2023-09", url: "https://www.axios.com/2023/09/04/babylon-health-emed-bankruptcy", primary: false }
      ]
    }
  },
  {
    id: "zume",
    name: "Zume",
    monogram: "Z",
    founded: "2015",
    ceased: "2023",
    sector: "robotics",
    peakValue: "$2.25B",
    capital: "$445M raised",
    location: "California, US",
    status: "Shut down",
    confidence: "Medium",
    accent: "red",
    causeTags: ["capital intensity", "pivots", "unit economics"],
    en: {
      sectorLabel: "Food robotics",
      statusLabel: "Shut down",
      capitalLabel: "$445M raised",
      summary: "Zume began with robot-made pizza, raised hundreds of millions, pivoted toward sustainable packaging, and ultimately liquidated its assets.",
      cause: "A capital-heavy automation thesis struggled to prove repeatable economics, then lost coherence through major pivots.",
      lesson: "Automation can improve a process without making the surrounding business model attractive or defensible.",
      timeline: [
        { year: "2015", title: "Robot pizza launches", body: "Zume starts by automating parts of pizza production and delivery." },
        { year: "2018", title: "SoftBank backs the thesis", body: "A $375 million investment reportedly values the company at $2.25 billion." },
        { year: "2020", title: "Pizza operations close", body: "Zume cuts jobs and pivots toward food production systems and sustainable packaging." },
        { year: "2023", title: "The company shuts down", body: "Zume ceases operations and begins liquidating assets after raising a reported $445 million." }
      ],
      findings: [
        { type: "fact", title: "The original business was abandoned", body: "The robot-pizza operation closed before the company shifted focus toward packaging." },
        { type: "fact", title: "Substantial capital did not produce continuity", body: "The company shut down after a reported $445 million in venture funding." },
        { type: "inference", title: "Technology excitement outran unit economics", body: "The automation story attracted capital before a repeatable, focused business was secured." }
      ],
      sources: [
        { label: "Zume shuts down after raising $445 million", publisher: "Axios", date: "2023-06", url: "https://www.axios.com/2023/06/12/softbank-pizza-robot-shuts-down-zume-445-million", primary: false },
        { label: "Zume company profile and history", publisher: "Wikipedia source index", date: "2023-06", url: "https://en.wikipedia.org/wiki/Zume", primary: false }
      ]
    },
    zh: {
      sectorLabel: "食品机器人",
      statusLabel: "停止运营",
      capitalLabel: "$445M 融资",
      summary: "Zume 从机器人制作披萨起步，获得数亿美元融资，随后转向可持续包装，最终清算资产。",
      cause: "高资本投入的自动化模式未能证明可复制的经济模型，随后又在大幅转型中失去业务连贯性。",
      lesson: "自动化可以改善某个流程，却不一定能让周围的商业模式变得有吸引力或具有防御性。",
      timeline: [
        { year: "2015", title: "机器人披萨上线", body: "Zume 从自动化披萨生产和配送的部分环节开始。" },
        { year: "2018", title: "软银押注", body: "3.75 亿美元投资据报道使公司估值达到 22.5 亿美元。" },
        { year: "2020", title: "披萨业务关闭", body: "Zume 裁员并转向食品生产系统和可持续包装。" },
        { year: "2023", title: "公司关闭", body: "在累计融资据报道达到 4.45 亿美元后，Zume 停止运营并开始清算资产。" }
      ],
      findings: [
        { type: "fact", title: "原始业务被放弃", body: "机器人披萨业务关闭后，公司转向包装业务。" },
        { type: "fact", title: "大量资本没有换来业务连续性", body: "公司在获得据报道 4.45 亿美元风险投资后关闭。" },
        { type: "inference", title: "技术热情跑在单位经济模型前面", body: "自动化叙事先吸引了资本，但可复制且聚焦的业务没有及时建立。" }
      ],
      sources: [
        { label: "Zume 融资 4.45 亿美元后关闭", publisher: "Axios", date: "2023-06", url: "https://www.axios.com/2023/06/12/softbank-pizza-robot-shuts-down-zume-445-million", primary: false },
        { label: "Zume 公司历史与来源索引", publisher: "Wikipedia source index", date: "2023-06", url: "https://en.wikipedia.org/wiki/Zume", primary: false }
      ]
    }
  }
];
