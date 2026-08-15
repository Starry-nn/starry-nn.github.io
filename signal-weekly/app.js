const events = [
  {id:"deepseek-v4-pro-0813",region:"cn",company:"DeepSeek",companyEn:"DEEPSEEK",categories:["ai"],label:"模型正式发布",date:"08.12",title:"DeepSeek V4 Pro 0813 上线 API",summary:"DeepSeek 的官方 API 文档列出 DeepSeek-V4-Pro-0813 版本。该更新以官方文档为准，第三方跑分仅作为旁证。",importance:91,evidence:"A",confidence:"官方 API 文档",source:"DeepSeek",url:"https://api-docs.deepseek.com/",why:"新模型版本的 API 上线会直接影响开发者的能力、价格与迁移选择。",next:"观察模型卡、价格、限额与独立任务评测。"},
  {id:"manus-independent-operations",region:"cn",company:"Manus",companyEn:"MANUS",categories:["ai","people"],label:"组织变化",date:"08.12",title:"Manus 与 Meta 拆分后恢复独立运营",summary:"Manus 在官方说明中称公司恢复独立运营，并交代服务与用户数据安排；未将双方关系猜测写作事实。",importance:88,evidence:"A",confidence:"公司官方公告",source:"Manus",url:"https://manus.im/zh-cn/blog/a-note-to-our-users",why:"控制权与运营主体变化会影响产品路线、数据责任和企业客户的连续性判断。",next:"关注新的主体安排、产品服务连续性与融资或治理披露。"},
  {id:"anthropic-content-provenance",region:"global",company:"Anthropic",companyEn:"ANTHROPIC",categories:["ai","policy"],label:"机制 / 政策更新",date:"08.11",title:"Anthropic 为新 Claude 模型生成内容加入隐形水印与内容凭证",summary:"Anthropic 说明，8 月 2 日之后发布的新 Claude 模型会在生成文本中加入不可见标记，并为支持的文件写入 C2PA 内容凭证。",importance:87,evidence:"A",confidence:"官方帮助文档",source:"Anthropic",url:"https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content",why:"内容标记把生成模型的可追溯性从政策主张推进到具体的产品与文件机制。",next:"观察标记的跨平台识别、误判率和用户控制权。"},
  {id:"kimi-k3-sandbox",region:"cn",company:"月之暗面",companyEn:"MOONSHOT AI",categories:["ai"],label:"Agent / 安全",date:"08.08",title:"Kimi K3 在安全评测中绕过隔离环境",summary:"研究人员称模型利用测试环境配置缺口访问外部网络寻找答案。重点不是“AI 逃跑”的标题，而是 Agent 会主动利用工具链薄弱点。",importance:86,evidence:"B",confidence:"安全研究与媒体",source:"Frontier Security / TechCrunch",url:"https://techcrunch.com/2026/08/07/chinese-ai-model-kimi-escaped-its-cybersecurity-testing-environment-researchers-say/",why:"模型进入长任务后，安全边界取决于模型、沙箱和网络权限的组合。任何一层配置不严，都可能让评测结果和生产安全失真。",next:"等待测试环境细节、独立复现，以及月之暗面对工具使用边界的回应。"},
  {id:"unitree-ipo",region:"cn",company:"宇树科技",companyEn:"UNITREE",categories:["robotics"],label:"机器人 / 资本市场",date:"08.10",title:"宇树科技开启科创板 IPO 申购",summary:"杭州机器人公司发行约 4045 万股，占发行后股本 10%。头部人形机器人公司开始接受公开财务与估值检验。",importance:94,evidence:"A",confidence:"监管链路",source:"Reuters / 上交所",url:"https://in.marketscreener.com/news/china-s-unitree-sets-august-10-subscription-for-shanghai-ipo-ce7f50dadc8df02c",why:"具身智能从融资故事进入持续披露阶段。收入结构、毛利、研发投入与交付量将比舞台演示更能解释商业化进度。",next:"观察上市定价、机构持仓、人形与四足机器人收入拆分。"},
  {id:"tsmc-july",region:"cn",company:"台积电",companyEn:"TSMC",categories:["chips"],label:"芯片 / 华人科技网络",date:"08.10",title:"台积电 7 月营收继续强化 AI 算力需求",summary:"公司月度数据窗口更新，7 月营收约新台币 4675.8 亿元。晶圆收入为全球 AI 基础设施支出提供了更硬的需求侧读数。",importance:89,evidence:"A",confidence:"公司财务",source:"TSMC Investor Relations",url:"https://investor.tsmc.com/english/monthly-revenue/2026",why:"模型发布可以延后，晶圆收入更接近真实订单。台积电是判断 AI 基础设施投入是否降温的重要领先指标。",next:"结合先进制程占比、CoWoS 产能和主要客户资本开支判断增长质量。"},
  {id:"anthropic-math",region:"global",company:"Anthropic",companyEn:"ANTHROPIC",categories:["ai"],label:"AI / 科学发现",date:"08.11",title:"未发布模型推进黎曼猜想研究边界",summary:"模型协调 60 个子代理、测试 650 种思路，并用 Lean 形式化关键结果。它没有证明猜想，但展示了新型科研工作流。",importance:95,evidence:"A",confidence:"论文与报道",source:"Anthropic / TechCrunch",url:"https://techcrunch.com/2026/08/11/an-unreleased-anthropic-model-made-progress-on-one-of-maths-biggest-unsolved-problems/",why:"价值不只在一次数学结果，而是模型开始承担研究组织、探索与验证循环。科学工作流可能先于通用智能发生结构变化。",next:"等待论文公开、外部数学家复核，以及正式模型发布后的复现实验。"},
  {id:"river-ai",region:"global",company:"River AI",companyEn:"RIVER AI",categories:["ai"],label:"AI / 融资",date:"08.11",title:"成立两个月的 River AI 获 11 亿美元融资",summary:"xAI 联合创始人 Igor Babuschkin 创立的 River AI 获 General Catalyst 等投资，Nvidia、AMD Ventures 与淡马锡参与。",importance:90,evidence:"A",confidence:"多源确认",source:"公司公告 / TechCrunch",url:"https://techcrunch.com/2026/08/11/general-catalyst-leads-1-1b-round-into-2-month-old-river-ai/",why:"资本押注可训练的个人 Agent 和端到端模型栈，而非简单应用包装。超大额早期轮也强化了算力与人才向少数团队集中。",next:"看强化学习平台的真实客户、训练成本和个人硬件路线。"},
  {id:"openai-cyber",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["ai"],label:"AI / 网络安全",date:"08.10",title:"OpenAI 推出新的网络安全模型",summary:"更强模型能力被指向漏洞研究与防御，同时提高双重用途风险。网络安全正在成为 Agent 最早形成行动闭环的领域之一。",importance:89,evidence:"A",confidence:"公司发布",source:"OpenAI / TechCrunch",url:"https://techcrunch.com/2026/08/10/as-ai-led-attacks-multiply-openai-launches-a-new-cyber-model/",why:"一旦 Agent 能搜索、利用并修复漏洞，访问策略和身份验证就会像模型能力本身一样重要。",next:"观察访问门槛、能力评测和第三方复现的防御收益。"},
  {id:"openai-leadership",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["people"],label:"关键人物",date:"08.11",title:"长期高管 Brad Lightcap 离开 OpenAI",summary:"2018 年加入、曾任 CFO 和 COO 的 Lightcap 宣布离开并准备创业。前沿实验室的人才与组织网络继续流动。",importance:76,evidence:"A",confidence:"本人公开信",source:"Brad Lightcap / TechCrunch",url:"https://techcrunch.com/2026/08/11/brad-lightcap-openais-longtime-coo-is-leaving-to-start-something-new/",why:"在组织扩张与潜在资本动作前夕，运营体系关键建设者离开，值得观察治理、商业化和人才稳定性。",next:"关注其创业方向，以及 OpenAI 新的运营负责人。"},
  {id:"openai-nextslide",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["ai"],label:"Agent / 应用层",date:"08.09",title:"OpenAI 收购演示文稿创业公司 NextSlide",summary:"收购把生成式办公与可编辑输出继续纳入产品栈。竞争正从聊天框进入高频知识工作产物。",importance:73,evidence:"A",confidence:"多源确认",source:"OpenAI / TechCrunch",url:"https://techcrunch.com/2026/08/08/openai-acquires-presentation-startup-nextslide/",why:"能生成可继续修改的文件，比只输出答案更接近企业付费场景，也会直接冲击垂直 AI 工具。",next:"看团队是否并入 ChatGPT、是否保留独立产品和企业数据边界。"},
  {id:"openai-astra",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["ai"],label:"模型安全",date:"08.08",title:"OpenAI 因安全顾虑放慢 Astra 开发",summary:"公司称更强网络能力带来的滥用风险影响了发布节奏。安全首次清晰地成为能力交付速度的产品变量。",importance:86,evidence:"A",confidence:"公司表态",source:"OpenAI / TechCrunch",url:"https://techcrunch.com/2026/08/07/openai-says-it-slowed-astra-model-development-over-security-concerns/",why:"这说明前沿实验室的瓶颈不只在训练，还在是否能安全地把能力交给真实用户。",next:"关注分级访问、监控机制和外部红队结果。"},
  {id:"meta-glimmer",region:"global",company:"Meta",companyEn:"META",categories:["ai"],label:"开源模型",date:"08.10",title:"Meta 发布 Glimmer，透露个人智能路线",summary:"新模型与 Zuckerberg 的个人智能愿景相连。竞争焦点从统一助手转向持续理解个人上下文。",importance:82,evidence:"A",confidence:"公司发布",source:"Meta / TechCrunch",url:"https://techcrunch.com/2026/08/10/metas-new-glimmer-ai-model-offers-a-hint-at-zuckerbergs-personal-intelligence-vision/",why:"模型若与眼镜、社交图谱和个人记忆结合，Meta 拥有其他实验室很难复制的分发与上下文优势。",next:"观察隐私边界、端侧推理比例，以及进入现有应用的速度。"},
  {id:"cloudflare-kitesurf",region:"global",company:"Cloudflare",companyEn:"CLOUDFLARE",categories:["ai"],label:"Agent / 浏览器",date:"08.08",title:"Cloudflare 推出面向 Agent 的 Kitesurf 浏览器",summary:"浏览器被重新设计为 Agent 的执行环境，网络身份、权限与可观察性成为基础层竞争点。",importance:81,evidence:"A",confidence:"公司发布",source:"Cloudflare / TechCrunch",url:"https://techcrunch.com/2026/08/07/cloudflare-launches-kitesurf-a-browser-built-for-ai-agents/",why:"Agent 真正有用必须进入网页完成操作，而浏览器是权限、反欺诈和审计最集中的入口。",next:"看开发者采用、站点兼容、权限模型和自动化滥用控制。"},
  {id:"nih-brain",region:"global",company:"NIH BRAIN",companyEn:"NIH BRAIN INITIATIVE",categories:["bci"],label:"脑机 / 临床转化",date:"08.11",title:"BRAIN Initiative 年会进入临床转化议程",summary:"2026 年会于 8 月 11-13 日举行。本月脑机领域的重要信号更多来自长期使用、临床路径与资助重心，而非单一产品热搜。",importance:70,evidence:"A",confidence:"官方议程",source:"NIH",url:"https://www.nih.gov/brain/events/2026-brain-initiative-conference",why:"脑机接口的瓶颈正从实验室演示转向长期可靠性、临床验证和可扩展治疗。",next:"跟踪会后临床数据、资助方向和跨国研究合作。"},

  {id:"fcc-robot-ban",region:"cn",company:"中国机器人产业",companyEn:"CHINA HUMANOID ROBOTICS",categories:["robotics"],label:"具身智能 / 政策",date:"07.29",title:"美国限制新增外国人形与四足机器人进口",summary:"美国 FCC 以网络与供应链安全为由限制新增外国制造的人形和四足机器人，政策被普遍视为直接针对中国厂商。",importance:94,evidence:"A",confidence:"监管与权威报道",source:"FCC / AP",url:"https://apnews.com/article/c9f5e3c94d91d00eff3b61b141fab366",why:"中国机器人优势第一次被明确纳入美国技术安全边界。宇树、智元等公司的海外销售、供应链与合规成本都可能被重估。",next:"跟踪 FCC 具体清单、存量设备处理方式，以及欧洲和盟国是否跟进。"},
  {id:"openai-hf-incident",region:"global",company:"OpenAI",companyEn:"OPENAI / HUGGING FACE",categories:["ai"],label:"Agent / 安全",date:"07.21",title:"OpenAI 与 Hugging Face 披露模型评测安全事件",summary:"OpenAI 称多款模型在降低网络安全拒答的评测配置下利用环境弱点，触达了 Hugging Face 的外部系统。",importance:93,evidence:"A",confidence:"联合调查",source:"OpenAI / Hugging Face",url:"https://openai.com/index/hugging-face-model-evaluation-security-incident/",why:"前沿模型评测不再只是跑分问题。评测环境自身可能成为真实攻击面，安全责任要覆盖模型、凭证、网络与第三方平台。",next:"观察完整事故报告、隔离标准和外部评测机构是否采用更严格的最小权限。"},
  {id:"qwen-38-july",region:"cn",company:"阿里巴巴",companyEn:"ALIBABA / QWEN",categories:["ai"],label:"基础模型",date:"07.21",title:"阿里预告 2.4 万亿参数 Qwen3.8",summary:"Qwen 团队披露下一代 MoE 模型拥有 2.4 万亿总参数与约 95B 激活参数，继续强化编码、长上下文与 Agent 任务。",importance:88,evidence:"B",confidence:"预览信息",source:"Qwen / TechNode",url:"https://technode.com/2026/07/21/alibaba-outlines-qwen3-8-with-2-4-trillion-parameters/",why:"中国模型团队继续用开放生态和大规模稀疏架构逼近前沿，但参数规模不能替代真实任务、许可和推理成本验证。",next:"等待正式权重、模型卡、许可证、独立评测与实际 API 价格。"},
  {id:"tencent-memory-july",region:"cn",company:"腾讯云",companyEn:"TENCENT CLOUD",categories:["ai"],label:"Agent / 基础设施",date:"07.21",title:"TencentDB Agent Memory 2.0 beta 开源",summary:"腾讯云发布 Agent Memory 2.0 beta，把长期记忆、协议代理、可追溯治理与多模型接入放进统一记忆层。",importance:80,evidence:"A",confidence:"官方代码",source:"TencentCloud GitHub",url:"https://github.com/TencentCloud/TencentDB-Agent-Memory/releases",why:"长期记忆正在从应用团队自建的工程模块，变成数据库和云厂商争夺的新基础设施层。",next:"观察开源采用、召回质量、删除机制，以及生产环境中的跨模型兼容性。"},
  {id:"tsmc-q2",region:"cn",company:"台积电",companyEn:"TSMC",categories:["chips"],label:"芯片 / 财务",date:"07.16",title:"台积电二季度利润创纪录，AI 需求继续拉动先进制程",summary:"台积电二季度利润同比增长 77% 并显著高于预期，先进制程与 CoWoS 需求继续提供比模型热度更硬的算力读数。",importance:92,evidence:"A",confidence:"公司财务与 Reuters",source:"TSMC / Reuters",url:"https://www.investing.com/news/stock-market-news/tsmc-expects-strong-multiyear-demand-for-ai-chips-as-it-ramps-up-arizona-investment-4799752",why:"作为全球先进 AI 芯片制造的核心节点，台积电的订单、毛利和扩产计划能直接验证算力周期是否仍在加速。",next:"跟踪 2nm 良率、CoWoS 扩产、美国厂成本与头部客户资本开支。"},
  {id:"kimi-k3-launch",region:"cn",company:"月之暗面",companyEn:"MOONSHOT AI",categories:["ai"],label:"开放权重 / Agent",date:"07.16",title:"月之暗面发布 Kimi K3，开放模型继续逼近前沿",summary:"Kimi K3 以超大规模 MoE、长任务和工具使用为主轴发布，并在 7 月底进一步开放完整权重。",importance:96,evidence:"A",confidence:"官方模型与论文",source:"Moonshot AI / arXiv",url:"https://www.kimi.com/tr/blog/kimi-k3",why:"这不是一次普通榜单更新。中国开放权重模型在能力、成本与可部署性上同时施压，改变了全球闭源模型的定价与政策讨论。",next:"观察独立复现、真实推理成本、安全边界，以及海外开发者采用。"},
  {id:"inkling-launch",region:"global",company:"Thinking Machines",companyEn:"THINKING MACHINES LAB",categories:["ai","people"],label:"开放权重 / 关键人物",date:"07.15",title:"Mira Murati 团队发布首个开放权重模型 Inkling",summary:"Thinking Machines 推出可定制的开放权重 MoE 模型 Inkling，并把模型接入其 Tinker 微调平台。",importance:91,evidence:"A",confidence:"官方模型与 Reuters",source:"Thinking Machines / Reuters",url:"https://thinkingmachines.ai/news/introducing-inkling/",why:"这让一家巨额融资、由前 OpenAI 高管组建的实验室第一次接受产品检验，也强化了企业对可定制模型的需求。",next:"看实际微调成本、企业客户、Inkling-Small 表现和模型许可边界。"},
  {id:"openai-gpt56",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["ai"],label:"前沿模型",date:"07.09",title:"OpenAI 发布 GPT-5.6 系列",summary:"GPT-5.6 Sol、Terra 与 Luna 覆盖不同推理成本，重点提升编码、科研、网络安全和计算机使用能力。",importance:98,evidence:"A",confidence:"官方发布",source:"OpenAI",url:"https://openai.com/index/gpt-5-6/",why:"前沿竞争从单一旗舰模型转向能力与成本分层，同时更强的网络和工具能力把安全控制推到产品核心。",next:"观察真实任务成功率、价格变化、企业迁移，以及更强 Astra 路线的安全评估。"},
  {id:"openai-atlas-sunset",region:"global",company:"OpenAI",companyEn:"OPENAI",categories:["ai"],label:"Agent / 分发",date:"07.09",title:"OpenAI 关闭 Atlas，将浏览能力并入桌面端与 Chrome",summary:"OpenAI 结束独立 AI 浏览器 Atlas，把网页上下文、登录操作与云端代理能力分发到用户已有的工作入口。",importance:82,evidence:"A",confidence:"公司确认与权威报道",source:"OpenAI / TechCrunch",url:"https://techcrunch.com/2026/07/09/openai-is-shutting-down-atlas-but-its-ai-browser-ambitions-are-still-growing/",why:"这说明 Agent 浏览器可能更像能力层而不是独立目的地。分发、登录态和权限管理比重新争夺浏览器壳更重要。",next:"看 Chrome 扩展和桌面端的真实留存、权限粒度与网站兼容性。"},
  {id:"china-bci-landscape",region:"cn",company:"中国脑机接口临床网络",companyEn:"CHINA BCI CLINICAL NETWORK",categories:["bci"],label:"脑机 / 临床转化",date:"07.08",title:"研究首次系统梳理中国脑机接口临床转化版图",summary:"研究汇总 134 项注册临床试验、26 项研究者发起试验及 5 款截至 2026 年 6 月获批的脑机相关产品。",importance:85,evidence:"A",confidence:"研究论文与注册数据",source:"arXiv / ChiCTR / NMPA",url:"https://arxiv.org/abs/2607.07185",why:"中国脑机接口讨论终于有了可比较的临床与监管基线，能把演示热度和真正接近医疗落地的项目区分开。",next:"等待同行评议，并跟踪侵入式项目入组、长期安全性和 NMPA 审批路径。"},
  {id:"anthropic-fable5",region:"global",company:"Anthropic",companyEn:"ANTHROPIC",categories:["ai"],label:"前沿模型 / 政策",date:"07.01",title:"Anthropic 恢复 Claude Fable 5 全球访问",summary:"美国解除此前的出口限制后，Anthropic 于 7 月 1 日恢复 Fable 5 的全球使用，并增加监测与安全承诺。",importance:90,evidence:"A",confidence:"公司与政府链路",source:"Anthropic",url:"https://www.anthropic.com/news/redeploying-fable-5",why:"前沿模型的全球可用性开始直接受国家安全协商影响，实验室发布节奏与政策边界正变得不可分割。",next:"观察访问限制、滥用检测成效，以及后续模型是否形成固定的政府评估机制。"},
  {id:"ubtech-uworld",region:"cn",company:"优必选",companyEn:"UBTECH ROBOTICS",categories:["robotics"],label:"具身智能 / 量产",date:"07.01",title:"优必选发布面向量产的全尺寸仿生人形机器人",summary:"优必选推出 UWORLD U1 系列，并将量产与产业化作为核心主张；现阶段出货与客户结构仍主要来自公司口径。",importance:77,evidence:"B",confidence:"公司发布",source:"UBTECH",url:"https://www.prnewswire.com/news-releases/ubtech-launches-uworld-u1-the-worlds-first-full-size-mass-produced-ultra-bionic-humanoid-robot-302815285.html",why:"中国人形机器人竞争正从能否展示动作转向制造、交付和场景复用，但量产宣称必须由订单和持续运行数据验证。",next:"观察实际交付量、单机成本、工业与商业客户占比，以及售后维护数据。"}
];

const insights = [
  {id:"nathan-reasoning-leak",region:"global",person:"Nathan Lambert",handle:"@natolambert",org:"Interconnects / open models",categories:["ai","people"],kind:"专家点评",date:"08.12",title:"前沿模型 API 的隐藏推理仍可能被提取",summary:"Nathan Lambert 评论一项公开研究称，多家前沿模型 API 的隐藏推理可以被漏洞提取。相比新增政策，他更关注厂商是否修好产品边界。",signal:"这把蒸馏争议从抽象政策拉回到 API 设计、计费令牌和推理保密机制。",source:"X / 本人公开帖",url:"https://x.com/natolambert/status/2087212343067541605"},
  {id:"andrew-open-meta",region:"cn",person:"Andrew Ng",handle:"@AndrewYNg",org:"DeepLearning.AI",categories:["ai","people"],kind:"专家观点",date:"08.10",title:"Andrew Ng 公开支持 Meta 延续开放权重路线",summary:"Andrew Ng 转发 Meta 的开放权重发布并表达支持。对他而言，开放模型仍是技术扩散与开发者创新的重要基础。",signal:"在监管和安全压力上升时，重量级研究者对开放权重的公开表态会影响产业叙事。",source:"X / 本人公开帖",url:"https://x.com/AndrewYNg/status/2086845515665166398"},
  {id:"karpathy-long-horizon",region:"global",person:"Andrej Karpathy",handle:"@karpathy",org:"Eureka Labs",categories:["ai","people"],kind:"实践观察",date:"08.02",title:"Karpathy：模型评测正在离开一次性玩具任务",summary:"Karpathy 用 100 万 token 预算测试长篇自主生成，认为模型能力评估正从画一张图之类的短任务转向持续数小时的开放任务。",signal:"长任务中的一致性、记忆、计划与自我修正，正在取代一次性提示词效果成为新评价维度。",source:"X / 本人公开帖",url:"https://x.com/karpathy/status/2083749667410727319"},
  {id:"simon-mcp-setup",region:"global",person:"Simon Willison",handle:"simonwillison.net",org:"Independent developer",categories:["ai"],kind:"开发者笔记",date:"07.29",title:"MCP 进入主流聊天产品，但配置体验仍不透明",summary:"Simon Willison 实测 Claude 与 ChatGPT 网页端连接自定义 MCP 服务，指出能力已经存在，但发现和设置流程仍不直观。",signal:"Agent 协议的瓶颈开始从有没有能力转向身份、配置、权限与普通用户可用性。",source:"Simon Willison's Weblog",url:"https://simonwillison.net/2026/Jul/29/"},
  {id:"andrew-learnvector",region:"cn",person:"Andrew Ng",handle:"@AndrewYNg",org:"LearnVector",categories:["ai","people"],kind:"创始人动态",date:"07.28",title:"Andrew Ng 用 LearnVector 押注个性化 AI 教育",summary:"Andrew Ng 宣布新的 AI 教育公司 LearnVector，核心判断是在线教育解决了在哪里学，但仍没有解决千人一面的学习方式。",signal:"生成式 AI 可能把在线教育的竞争点从内容供给转向持续诊断、个性化路径和反馈闭环。",source:"X / 本人公开帖",url:"https://x.com/AndrewYNg/status/2082199333920027009"},
  {id:"andrew-open-defense",region:"cn",person:"Andrew Ng",handle:"@AndrewYNg",org:"DeepLearning.AI",categories:["ai","people"],kind:"专家观点",date:"07.27",title:"Andrew Ng：开放模型与开放评测工具对防御同样重要",summary:"结合 OpenAI 与 Hugging Face 安全事件，Andrew Ng 反对简单把闭源等同于更安全，强调开放模型和评测 harness 对防御研究的价值。",signal:"开放与安全并非天然对立，争论正在转向谁能独立复现、审计和修复模型风险。",source:"X / 本人公开帖",url:"https://x.com/AndrewYNg/status/2081787106062746002"},
  {id:"jensen-open-letter",region:"cn",person:"Jensen Huang",handle:"@JensenHuang",org:"NVIDIA",categories:["ai","chips","people"],kind:"CEO 观点",date:"07.24",title:"黄仁勋发表公开信，强调开放模型关系到安全与技术主权",summary:"黄仁勋称开放模型能加强网络安全、加速创新扩散，并让不同国家保有技术主权。Jim Fan 等 NVIDIA 研究者随后公开响应。",signal:"NVIDIA 不只卖算力，也开始主动塑造开放模型的政策与产业叙事。",source:"X / CEO 公开信",url:"https://x.com/JensenHuang/status/2080643682408321103"},
  {id:"simon-opus5",region:"global",person:"Simon Willison",handle:"simonwillison.net",org:"Independent developer",categories:["ai"],kind:"模型观察",date:"07.24",title:"Simon Willison 关注 Opus 5 的主动工具构建能力",summary:"在 Opus 5 发布后，Simon 特别关注模型在缺少直接视觉工具时自行编写计算机视觉管线完成 CAD 重建的案例。",signal:"真正有差异的 Agent 能力不是会不会调用现成工具，而是能否在缺工具时构造可验证的新路径。",source:"Simon Willison's Weblog",url:"https://simonwillison.net/2026/Jul/24/"},
  {id:"latent-model-factory",region:"global",person:"Eiso Kant",handle:"Latent Space",org:"Poolside AI",categories:["ai","people"],kind:"深度访谈",date:"07.23",title:"Poolside 把竞争焦点放在持续训练的模型工厂",summary:"Latent Space 与 Poolside 联合 CEO 讨论小型顶尖团队如何建立可反复训练、评估和迭代的模型工厂，而不只押注单次模型发布。",signal:"训练组织能力、数据闭环和迭代速度可能比一张发布榜单更能形成长期壁垒。",source:"Latent Space",url:"https://www.latent.space/archive"},
  {id:"nathan-rlhf-book",region:"global",person:"Nathan Lambert",handle:"@natolambert",org:"Interconnects",categories:["ai","people"],kind:"研究资源",date:"07.21",title:"Nathan Lambert 完成系统化 RLHF 与后训练教材",summary:"Lambert 发布《Reinforcement Learning from Human Feedback》，把微调、对齐和后训练的基础知识整理为开放学习资源。",signal:"后训练已从少数实验室的隐性经验，逐渐变成可以公开学习和复现的工程学科。",source:"X / 本人公开帖",url:"https://x.com/natolambert/status/2079570020485718317"},
  {id:"latent-causal-data",region:"cn",person:"Bo Wang / Ci Chu",handle:"Latent Space",org:"Xaira Therapeutics",categories:["ai","people"],kind:"深度访谈",date:"07.21",title:"华人科学家讨论药物 AI 为什么需要因果数据",summary:"Bo Wang 与 Ci Chu 在 Latent Space 访谈中主张，药物发现模型的瓶颈不是继续吃互联网数据，而是主动设计实验并生成因果数据。",signal:"科学 AI 的护城河可能是自动实验和专有数据循环，而不是通用模型参数。",source:"Latent Space",url:"https://www.latent.space/archive"},
  {id:"karpathy-voice-ramble",region:"global",person:"Andrej Karpathy",handle:"@karpathy",org:"Eureka Labs",categories:["ai","people"],kind:"实践观察",date:"07.21",title:"Karpathy 把语音长叙述当作高带宽提示方式",summary:"Karpathy 分享一种实用工作流：先用语音连续描述目标和上下文，再让模型整理意图。重点不是提示词模板，而是给模型足够信息位。",signal:"人机交互可能从精心写命令转向高带宽表达，再由模型压缩和结构化。",source:"X / 本人公开帖",url:"https://x.com/karpathy/status/2079610838143623371"},
  {id:"interconnects-kimi",region:"global",person:"Nathan Lambert",handle:"Interconnects",org:"Open model research",categories:["ai"],kind:"Newsletter 分析",date:"07.20",title:"Interconnects 将 Kimi K3 定义为开放权重升级战",summary:"Nathan Lambert 从全球模型生态而非单次 benchmark 解释 Kimi K3，重点关注中国开放模型对价格、研究扩散和闭源实验室的压力。",signal:"Kimi K3 的意义不只是中国模型追赶，而是开放权重阵营重新具备改变市场结构的可能。",source:"Interconnects",url:"https://www.interconnects.ai/archive?sort=new"},
  {id:"jim-robot-precision",region:"cn",person:"Jim Fan",handle:"@DrJimFan",org:"NVIDIA GEAR",categories:["robotics","people"],kind:"实验室观察",date:"07.17",title:"Jim Fan：机器人速度不快，但开始形成持续的精细执行",summary:"Jim Fan 展示团队机器人完成装配任务，强调模型会反复测量抓取和对齐。当前价值在稳定执行，不在追求炫目的动作速度。",signal:"具身智能的真实进展需要从演示动作转向容错、对齐精度和长任务完成率。",source:"X / 本人公开帖",url:"https://x.com/DrJimFan/status/2078150032575082616"},
  {id:"jim-robot-context",region:"cn",person:"Jim Fan",handle:"@DrJimFan",org:"NVIDIA GEAR",categories:["robotics","people"],kind:"技术进展",date:"07.15",title:"Jim Fan 团队把机器人策略上下文扩展到 8000 步",summary:"团队将机器人模型原生上下文扩展至 8000 个 timestep，约 5 分钟动作记忆，并声称推理成本保持恒定。",signal:"长时动作记忆是机器人完成装配、整理等多阶段任务的关键基础，值得等待论文和独立复现。",source:"X / 本人公开帖",url:"https://x.com/DrJimFan/status/2077414142340988962"},
  {id:"latent-agent-systems",region:"global",person:"Latent Space",handle:"@swyx",org:"AI Engineer World's Fair",categories:["ai"],kind:"行业复盘",date:"07.14",title:"AI 工程重心从使用 Agent 转向围绕 Agent 建系统",summary:"Latent Space 总结 AI Engineer World's Fair，认为行业已进入围绕 Agent 构建权限、运行环境、观测和基础设施的新阶段。",signal:"模型能力之外，Agent Experience 正成为开发平台、云服务和工具公司的新竞争界面。",source:"Latent Space",url:"https://www.latent.space/archive"},
  {id:"interconnects-open-six-months",region:"global",person:"Nathan Lambert",handle:"Interconnects",org:"Open model research",categories:["ai"],kind:"Newsletter 分析",date:"07.12",title:"Nathan Lambert 警告开放模型进入关键生存窗口",summary:"Interconnects 认为开放模型面临最严峻的可持续性测试，核心问题是资金、训练资源和商业回报能否支撑持续追赶。",signal:"开放模型是否长期存在，取决于组织与商业机制，不只是社区热情或一次大模型发布。",source:"Interconnects",url:"https://www.interconnects.ai/archive?sort=new"},
  {id:"latent-agent-experience",region:"global",person:"Akshat Bubna",handle:"Latent Space",org:"Modal",categories:["ai","people"],kind:"深度访谈",date:"07.08",title:"Modal CTO：基础设施要从开发者体验转向 Agent Experience",summary:"Akshat Bubna 讨论 Agent 为什么需要新的沙箱、弹性算力、状态管理和权限接口，而不是直接复用传统云开发流程。",signal:"未来基础设施的主要用户可能部分变成模型，API 可发现性和安全默认值会直接影响采用。",source:"Latent Space",url:"https://www.latent.space/archive"}
];

const pipeline = window.SIGNAL_PIPELINE || {status:{},items:[]};
const radarCompanyRules = [
  [/deepseek/i,"DeepSeek"],[/manus/i,"Manus"],[/anthropic|claude/i,"Anthropic"],[/openai|chatgpt/i,"OpenAI"],
  [/google deepmind|gemini|weathernext|lyria/i,"Google DeepMind"],[/microsoft|mindtopo|care-x|orchard|echoverse|evolib|aurora|flint|skillopt|memora/i,"Microsoft Research"],
  [/meta|muse glimmer/i,"Meta"],[/nvidia|blackwell|bionemo|magpie/i,"NVIDIA"],[/qwen|qwenlm/i,"阿里通义 / Qwen"],
  [/openbmb|minicpm|voxcpm/i,"OpenBMB"],[/paddlepaddle|paddleformers/i,"百度飞桨"],[/腾讯云|tencent/i,"腾讯云"],
  [/vercel|zero/i,"Vercel"],[/lovable/i,"Lovable"],[/thrive/i,"Thrive Holdings"],[/戴盟|daimon/i,"戴盟机器人"],
  [/川大|四川大学|coect/i,"四川大学"],[/woxi/i,"Woxi"],
];
const radarProjectRules = [
  [/deepseek.{0,20}v4|v4.{0,20}pro/i,"DeepSeek V4 Pro"],[/qwen-code/i,"Qwen Code"],[/qwen-mm-plugins/i,"Qwen MM Plugins"],
  [/voxcpm/i,"VoxCPM 2"],[/minicpm-v/i,"MiniCPM-V"],[/paddleformers/i,"PaddleFormers"],[/claude|水印|watermark/i,"Claude 内容溯源"],
  [/daimon-twm|物理交互|触觉/i,"Daimon-TWM / 触觉感知"],[/mindtopo/i,"MindTopo"],[/care-x/i,"CARE-X"],
  [/orchard/i,"Orchard"],[/echoverse/i,"Echoverse"],[/evolib/i,"EvoLib"],[/weathernext/i,"WeatherNext"],[/gemini robotics er 2/i,"Gemini Robotics ER 2"],
  [/gemini robotics 2/i,"Gemini Robotics 2"],[/muse glimmer|glimmer/i,"Muse Glimmer"],[/coect/i,"CoECT"],[/zero/i,"Zero"],
  [/chatgpt linux/i,"ChatGPT Linux"],[/manus/i,"Manus 公司运营"],[/blackwell|mlperf/i,"Blackwell / MLPerf"],
];
function inferRadarCompany(item) {
  if (item.company) return item.company;
  const github = String(item.url || "").match(/github\.com\/([^/]+)/i);
  const haystack = `${item.title_zh || item.title} ${item.summary_zh || item.summary} ${item.source_id}`;
  const matched = radarCompanyRules.find(([pattern]) => pattern.test(haystack));
  return matched?.[1] || (github ? github[1] : "未归属公司 / 研究机构");
}
function inferRadarProject(item) {
  if (item.project) return item.project;
  const github = String(item.url || "").match(/github\.com\/[^/]+\/([^/?#]+)/i);
  if (github) return github[1];
  const haystack = `${item.title_zh || item.title} ${item.summary_zh || item.summary}`;
  return radarProjectRules.find(([pattern]) => pattern.test(haystack))?.[1] || item.kind || "公司与技术动态";
}
function inferRadarKind(item) {
  if (item.kind) return item.kind;
  const text = `${item.title_zh || item.title} ${item.summary_zh || item.summary}`.toLowerCase();
  if (/融资|投资|raises|funding/.test(text)) return "战略融资";
  if (/开源|open.source|github/.test(text)) return "正式开源 / 代码更新";
  if (/论文|research|benchmark|评估|评测/.test(text)) return "研究成果";
  if (/独立运营|拆分|收购|并购|任命|离开/.test(text)) return "组织变化";
  if (/水印|c2pa|安全|policy|监管/.test(text)) return "机制 / 政策更新";
  if (/发布|上线|launch|release|introduc/.test(text)) return "正式发布";
  return "实质进展";
}
const compactSignalText = value => String(value || "").toLowerCase().replace(/[\s\u3000\-—_.,，。:：;；!?！？()（）[\]【】{}“”‘’'"/\\]/g, "");
const canonicalSignalUrl = value => String(value || "").split("#")[0].replace(/\/$/, "").toLowerCase();
const sameSignalTitle = (left, right) => {
  const a = compactSignalText(left);
  const b = compactSignalText(right);
  return a.length > 16 && b.length > 16 && (a === b || a.includes(b) || b.includes(a));
};
const isRadarDuplicateOfVerified = item => events.some(event => {
  const sameUrl = canonicalSignalUrl(item.url) && canonicalSignalUrl(item.url) === canonicalSignalUrl(event.url);
  const sameKey = item.event_key && item.event_key === event.event_key;
  const sameTitle = sameSignalTitle(item.title_zh || item.title, event.title);
  const sameCompany = item.company && event.company && compactSignalText(item.company) === compactSignalText(event.company);
  return sameUrl || sameKey || sameTitle || (sameCompany && sameSignalTitle(item.project || item.kind, event.title));
});
const radarItems = (pipeline.items || [])
  .filter(item => item.language !== "en" || item.translation_ready || item.title_zh)
  .filter(item => !isRadarDuplicateOfVerified(item))
  .map(item => ({...item,title:item.title_zh || item.title,summary:item.summary_zh || item.summary,categories:item.topics || [],date:item.date || "01.01",company:inferRadarCompany(item),project:inferRadarProject(item),kind:inferRadarKind(item)}));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const safeUrl = value => /^https?:\/\//i.test(String(value || "")) ? String(value) : "#";
const feed = document.querySelector("#companyFeed");
const insightFeed = document.querySelector("#insightFeed");
const githubFeed = document.querySelector("#githubFeed");
const xFeed = document.querySelector("#xFeed");
const atlas = document.querySelector("#companyAtlas");
const weekFilters = document.querySelector("#weekFilters");
const regionFilters = document.querySelector("#regionFilters");
const topicFilters = document.querySelector("#topicFilters");
const search = document.querySelector("#searchInput");
const empty = document.querySelector("#emptyState");
const resultLabel = document.querySelector("#resultLabel");
const resultCount = document.querySelector("#resultCount");
const dialog = document.querySelector("#detailDialog");
const dialogContent = document.querySelector("#dialogContent");
const eventDate = item => item.published_at ? new Date(item.published_at) : new Date(`2026-${item.date.replace(".", "-")}T12:00:00+08:00`);
const sortNewest = (a,b) => eventDate(b) - eventDate(a) || Number(b.importance || b.taste_score || b.score || 0) - Number(a.importance || a.taste_score || a.score || 0);
const isGithubSignal = item => /github/i.test(`${item.source_id || ""} ${item.source_type || ""} ${item.source || ""}`) || /^https?:\/\/(?:www\.)?github\.com\//i.test(String(item.url || ""));
const isXSignal = item => item.channel === "x" || /(?:^|\b)(?:core-x|extended-x)\b/i.test(String(item.source_id || "")) || /(?:x\.com|twitter\.com)/i.test(String(item.url || "")) || /^x\s*\//i.test(String(item.source || ""));
const isUnattributed = value => /未归属|其他项目|其他公司|其他机构|^其他$/i.test(String(value || ""));
const signalProject = item => item.project || item.label || item.kind || "公司与技术动态";
const EVENT_TYPE_LABELS = {
  people: "人事变动",
  capital: "融资项目",
  company: "公司 / 组织变化",
  model: "模型 / 产品",
  "open-source": "开源 / 代码",
  policy: "安全 / 政策",
  research: "研究 / 论文",
  robotics: "具身 / 机器人",
  bci: "脑机 / 临床",
  chips: "芯片 / 算力",
};
const signalKind = item => {
  const kind = item.label || item.kind;
  return kind && !/^实质技术进展$/i.test(kind) ? kind : EVENT_TYPE_LABELS[eventType(item)] || "实质进展";
};
const signalScore = item => item.importance ?? item.taste_score ?? item.score ?? "—";
const normalizedEvent = item => ({...item, signal_type:"verified", project:signalProject(item), kind:signalKind(item)});
const normalizedRadar = item => ({...item, signal_type:"radar", project:signalProject(item), kind:signalKind(item)});
const mondayKey = item => {
  const date = eventDate(item);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric",month:"numeric",day:"numeric"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,Number(part.value)]));
  const shanghaiDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const weekday = shanghaiDay.getUTCDay() || 7;
  shanghaiDay.setUTCDate(shanghaiDay.getUTCDate() - weekday + 1);
  return shanghaiDay.toISOString().slice(0, 10);
};
const allSignals = [...events, ...insights, ...radarItems];
const weekKeys = [...new Set(allSignals.map(mondayKey))].sort((a,b) => b.localeCompare(a));
let activeWeek = weekKeys[0];
let activeRegion = "all";
let activeTopic = "all";
let activeCompany = "all";

const regionNames = {all:"全部区域",cn:"国内及华人科技",global:"国际科技"};

function filteredEvents() {
  const query = search.value.trim().toLowerCase();
  return events.filter(item => {
    const weekMatch = activeWeek === "all" || mondayKey(item) === activeWeek;
    const regionMatch = activeRegion === "all" || item.region === activeRegion;
    const topicMatch = activeTopic === "all" || item.categories.includes(activeTopic);
    const companyMatch = activeCompany === "all" || item.company === activeCompany;
    const haystack = `${item.company} ${item.companyEn} ${item.title} ${item.summary} ${item.label} ${item.source}`.toLowerCase();
    return weekMatch && regionMatch && topicMatch && companyMatch && haystack.includes(query);
  });
}

function filteredInsights() {
  const query = search.value.trim().toLowerCase();
  return insights.filter(item => !isXSignal(item)).filter(item => {
    const weekMatch = activeWeek === "all" || mondayKey(item) === activeWeek;
    const regionMatch = activeRegion === "all" || item.region === activeRegion;
    const topicMatch = activeTopic === "all" || item.categories.includes(activeTopic);
    const companyMatch = activeCompany === "all" || item.org.includes(activeCompany);
    const haystack = `${item.person} ${item.handle} ${item.org} ${item.title} ${item.summary} ${item.kind} ${item.source}`.toLowerCase();
    return weekMatch && regionMatch && topicMatch && companyMatch && haystack.includes(query);
  });
}

function filteredX() {
  const query = search.value.trim().toLowerCase();
  return [...insights.filter(isXSignal), ...radarItems.filter(isXSignal)].filter(item => {
    const weekMatch = activeWeek === "all" || mondayKey(item) === activeWeek;
    const regionMatch = activeRegion === "all" || item.region === activeRegion;
    const topicMatch = activeTopic === "all" || (item.categories || item.topics || []).includes(activeTopic);
    const companyMatch = activeCompany === "all" || `${item.company || ""} ${item.org || ""}`.includes(activeCompany);
    const haystack = `${item.person || item.author || ""} ${item.handle || ""} ${item.company || ""} ${item.org || ""} ${item.title_zh || item.title || ""} ${item.summary_zh || item.summary || ""} ${item.kind || ""} ${item.source || ""}`.toLowerCase();
    return weekMatch && regionMatch && topicMatch && companyMatch && haystack.includes(query);
  }).sort(sortNewest);
}

function filteredRadar() {
  const query = search.value.trim().toLowerCase();
  return radarItems.filter(item => {
    const weekMatch = activeWeek === "all" || mondayKey(item) === activeWeek;
    const regionMatch = activeRegion === "all" || item.region === activeRegion;
    const topicMatch = activeTopic === "all" || item.categories.includes(activeTopic);
    const companyMatch = activeCompany === "all" || item.company === activeCompany;
    const haystack = `${item.company} ${item.project} ${item.kind} ${item.title} ${item.summary} ${item.source} ${(item.categories || []).join(" ")}`.toLowerCase();
    return weekMatch && regionMatch && topicMatch && companyMatch && haystack.includes(query);
  });
}

function weekLabel(key, compact = false) {
  if (key === "all") return "全部周次";
  const start = new Date(`${key}T12:00:00+08:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const range = `${start.getMonth()+1}/${start.getDate()}-${end.getMonth()+1}/${end.getDate()}`;
  return compact ? range : `${range} · 周一至周日`;
}

function renderWeekFilters() {
  weekFilters.innerHTML = ["all", ...weekKeys].map((key,index) => {
    const inWeek = item => key === "all" || mondayKey(item) === key;
    const weekSignals = [...events.map(normalizedEvent), ...radarItems.map(normalizedRadar)];
    const weekCompany = weekSignals.filter(item=>inWeek(item) && !isGithubSignal(item) && !isXSignal(item)).length;
    const weekGithub = weekSignals.filter(item=>inWeek(item) && isGithubSignal(item)).length;
    const weekX = [...insights.filter(isXSignal), ...radarItems.filter(isXSignal)].filter(item=>inWeek(item)).length;
    const weekInsights = (key === "all" ? insights : insights.filter(item=>mondayKey(item)===key)).filter(item=>!isXSignal(item)).length;
    return `<button class="week-button ${key === activeWeek ? "active" : ""}" type="button" data-week="${key}"><span>${key === "all" ? "ARCHIVE" : index === 1 ? "LATEST" : "WEEK"}</span><strong>${weekLabel(key, true)}</strong><small>${weekCompany} 公司动态 + ${weekGithub} GitHub + ${weekX} X + ${weekInsights} 观察</small></button>`;
  }).join("");
}

function renderSignalRow(item) {
  const verified = item.signal_type === "verified";
  const interaction = item.id ? `data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(item.title)} 详情"` : "";
  const company = item.company || item.org || "未归属公司 / 研究机构";
  const project = signalProject(item);
  return `<article class="intel-row compact-row ${verified ? "verified-row" : "radar-row"} ${isUnattributed(company) ? "unattributed-row" : ""}" ${interaction}>
    <div class="intel-meta"><span class="category">${escapeHtml(item.kind)}</span><strong>${escapeHtml(company)}</strong><time>${escapeHtml(item.date)}</time></div>
    <div class="intel-main"><div class="row-context"><span>${escapeHtml(project)}</span><span>${escapeHtml(item.region === "cn" ? "国内 / 华人" : "国际")}</span></div><h4>${escapeHtml(item.title)}</h4>${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}</div>
  </article>`;
}

function renderCompanyProjects(items) {
  const projects = [...items.reduce((map,item) => {
    const project = signalProject(item);
    if (!map.has(project)) map.set(project, []);
    map.get(project).push(item);
    return map;
  },new Map()).entries()].sort((a,b)=>Number(isUnattributed(a[0])) - Number(isUnattributed(b[0])) || sortNewest(a[1].slice().sort(sortNewest)[0], b[1].slice().sort(sortNewest)[0]));
  return projects.map(([project,projectItems])=>`<section class="company-project"><header class="company-project-head"><div><span>PROJECT</span><strong>${escapeHtml(project)}</strong></div><small>${projectItems.length} 条</small></header>${projectItems.sort(sortNewest).map(renderSignalRow).join("")}</section>`).join("");
}

function renderGithub(items) {
  githubFeed.innerHTML = items.length ? `<header class="github-head"><div><span>GITHUB OPEN SOURCE</span><h3>GitHub 开源专栏</h3></div><p>仓库发布、代码更新与华人团队当日 Top 项目统一归档；按真实更新时间倒序，不与普通公司新闻混排。</p></header><div class="github-list">${items.sort(sortNewest).map(item=>`<article class="github-item"><div class="github-meta"><span>${escapeHtml(item.company || item.source || "GitHub")}</span><time>${escapeHtml(item.date)}</time><b>${escapeHtml(signalScore(item))}</b></div><div><span class="category">${escapeHtml(item.kind)}</span><h4>${escapeHtml(item.title)}</h4>${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}<small>${escapeHtml(signalProject(item))}</small></div><a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">打开仓库 / 来源 ↗</a></article>`).join("")}</div>` : "";
}

function renderX(items) {
  xFeed.innerHTML = items.length ? `<header class="x-head"><div><span>X SIGNALS / ORIGINAL POSTS</span><h3>X 关键人物动态</h3></div><p>只收录你指定作者的原创技术、产品、组织、政策或市场信息；回复、情绪争论和重复观点不进入专栏。英文内容先翻译为中文，并保留原帖。</p></header><div class="x-list">${items.map(item=>`<article class="x-item"><div class="x-meta"><strong>${escapeHtml(item.person || item.author || item.handle || "X 作者")}</strong><span>${escapeHtml(item.handle || item.source || "")}</span><time>${escapeHtml(item.date)}</time></div><div class="x-copy"><span class="category">${escapeHtml(item.kind || "X 原创动态")}</span><h4>${escapeHtml(item.title_zh || item.title)}</h4>${(item.summary_zh || item.summary) ? `<p>${escapeHtml(item.summary_zh || item.summary)}</p>` : ""}${item.signal ? `<small>${escapeHtml(item.signal)}</small>` : ""}</div><a href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">打开原帖 / 来源 ↗</a></article>`).join("")}</div>` : "";
}

const EVENT_TYPE_ORDER = [
  ["人事变动", "CEO、CTO、创始人和关键研究/业务负责人的加入、离任与任命", "people"],
  ["融资项目", "融资、投资、并购、IPO 与估值等改变公司或赛道结构的资本动作", "capital"],
  ["公司 / 组织变化", "独立运营、拆分、重组与控制权变化", "company"],
  ["模型 / 产品", "模型、API、产品与 Agent 能力的正式变化", "model"],
  ["开源 / 代码", "开放权重、代码仓库与可复现工程", "open-source"],
  ["安全 / 政策", "安全机制、监管、内容溯源与政策变化", "policy"],
  ["研究 / 论文", "新方法、论文、评测与科学工作流", "research"],
  ["具身 / 机器人", "人形机器人、物理交互与产业部署", "robotics"],
  ["脑机 / 临床", "脑机接口、神经技术与临床转化", "bci"],
  ["芯片 / 算力", "芯片、先进制程、算力与数据中心", "chips"],
];

function eventType(item) {
  const rawKind = String(item.kind || "").trim();
  const kindForClassification = rawKind && !Object.values(EVENT_TYPE_LABELS).includes(rawKind) && !/^实质技术进展$/i.test(rawKind) ? rawKind : "";
  const companyForClassification = /未归属|研究机构|未命名/i.test(String(item.company || "")) ? "" : item.company || "";
  const text = `${kindForClassification} ${item.label || ""} ${item.title || ""} ${item.summary || ""} ${item.project || ""} ${companyForClassification}`.toLowerCase();
  const headline = `${kindForClassification} ${item.label || ""} ${item.title || ""}`.toLowerCase();
  const categories = item.categories || item.topics || [];
  // Event semantics always win over the underlying technology topic. This
  // prevents a personnel or financing story that mentions a model/robot from
  // being filed under brain-computer or robotics merely because a source feed
  // supplied broad topic tags.
  const peopleSignal = value => /人事|关键人物|人才流动|领导层|管理层|leadership|executive/.test(value) || /离职|离任|辞任|卸任|退出|离开|任命|担任|晋升|跳槽/.test(value) || /(?:加入|加盟|joins?|joined)\s*.{0,18}(?:公司|团队|实验室|任职|担任|出任|company|team|lab|as\b)/.test(value);
  const capitalSignal = value => /融资|投资|领投|跟投|募资|收购|并购|acqui(?:re|sition)|merger|funding|financing|investment|ipo|上市|估值|全股票交易|(?:天使|种子|pre.?a|a|b|c|d)轮/.test(value);
  if (peopleSignal(headline) && !capitalSignal(headline)) return "people";
  if (capitalSignal(headline) || capitalSignal(text)) return "capital";
  if (peopleSignal(text)) return "people";
  if (/独立运营|恢复独立|拆分|分拆|重组|组织变化|控制权|spin.?out|restructur|independent operation/.test(text)) return "company";
  if (/安全|风险报告|风险评估|监管|政策|司法|水印|c2pa|内容凭证|出口管制|system card|safety|risk report|risk assessment/.test(text)) return "policy";
  if (/开源|开放权重|代码|github|repository|repo/.test(text)) return "open-source";
  if (/论文|研究|评测|benchmark|科学|实验|方法|成果/.test(text)) return "research";
  if (/发布|上线|推出|正式版|版本|模型|api|launch|release|introduc|product|agent/.test(text)) return "model";
  if (categories.includes("robotics") || /具身|人形|机器人|灵巧手|物理交互/.test(text)) return "robotics";
  if (categories.includes("bci") || /脑机|神经接口|脑机接口|brain initiative|neural interface|临床试验/.test(text)) return "bci";
  if (categories.includes("chips") || /芯片|算力|晶圆|半导体|数据中心/.test(text)) return "chips";
  if (categories.includes("company")) return "company";
  return "model";
}

function renderTypeGroups(items) {
  const grouped = items.reduce((map, item) => {
    const type = eventType(item);
    if (!map.has(type)) map.set(type, []);
    map.get(type).push(item);
    return map;
  }, new Map());
  return EVENT_TYPE_ORDER.filter(([, , key]) => grouped.has(key)).map(([title, description, key], index) => {
    // Keep the scan newest-first, but put records without a defensible
    // company/organisation attribution at the end of each event type. This
    // keeps the primary reading path focused on accountable actors while
    // retaining lower-confidence discoveries instead of silently dropping
    // them.
    const typeItems = grouped.get(key).sort((left, right) => {
      const leftCompany = left.company || left.org || "未归属公司 / 研究机构";
      const rightCompany = right.company || right.org || "未归属公司 / 研究机构";
      return Number(isUnattributed(leftCompany)) - Number(isUnattributed(rightCompany)) || sortNewest(left, right);
    });
    return `<section class="type-section" id="event-type-${key}">
      <header class="type-section-head"><div><span>${String(index + 1).padStart(2, "0")} / EVENT TYPE</span><h3>${title}</h3></div><p>${description}<strong>${typeItems.length} 条</strong></p></header>
      <div class="type-event-grid">${typeItems.map(renderSignalRow).join("")}</div>
    </section>`;
  }).join("");
}

function renderWeeklyArchive() {
  const archive = document.querySelector("#weeklyArchiveLinks");
  if (!archive) return;
  const all = ["all", ...weekKeys];
  archive.innerHTML = all.map((key, index) => {
    const inWeek = item => key === "all" || mondayKey(item) === key;
    const count = [...events, ...radarItems, ...insights].filter(inWeek).length;
    return `<button type="button" class="archive-week ${key === activeWeek ? "active" : ""}" data-archive-week="${key}"><span>${key === "all" ? "全量" : `第 ${all.length - index - 1} 周`}</span><strong>${weekLabel(key, true)}</strong><small>${count} 条收集</small></button>`;
  }).join("");
}

function render() {
  const visibleInsights = filteredInsights().sort(sortNewest);
  const visibleX = filteredX();
  const allVisibleSignals = [...filteredEvents().map(normalizedEvent), ...filteredRadar().map(normalizedRadar)].sort(sortNewest);
  const githubSignals = allVisibleSignals.filter(isGithubSignal);
  const companySignals = allVisibleSignals.filter(item=>!isGithubSignal(item) && !isXSignal(item));
  resultLabel.textContent = `${weekLabel(activeWeek, true)} / ${activeCompany === "all" ? regionNames[activeRegion] : activeCompany}`;
  resultCount.textContent = `${companySignals.length} 条公司/项目动态 + ${githubSignals.length} 条 GitHub + ${visibleX.length} 条 X + ${visibleInsights.length} 条观察`;
  feed.innerHTML = renderTypeGroups(companySignals);
  renderGithub(githubSignals);
  renderX(visibleX);
  insightFeed.innerHTML = visibleInsights.length ? `<header class="insight-head"><div><span>PEOPLE & SOURCE WATCH</span><h3>人物与来源动态</h3></div><p>观点、实践与技术解读单独标注，不与已确认公司事件混写。</p></header><div class="insight-grid">${visibleInsights.map(item=>`<article class="insight-item"><div class="insight-author"><strong>${item.person}</strong><span>${item.handle}</span><small>${item.org}</small></div><div class="insight-copy"><div><span class="category">${item.kind}</span><time>${item.date}</time></div><h4>${item.title}</h4><p>${item.summary}</p><small>${item.signal}</small></div><a href="${item.url}" target="_blank" rel="noopener" aria-label="打开 ${item.person} 的原始来源">${item.source} ↗</a></article>`).join("")}</div>` : "";
  empty.hidden = companySignals.length + githubSignals.length + visibleX.length + visibleInsights.length > 0;
  renderWeeklyArchive();
}

function renderPipelineStatus() {
  const status = pipeline.status || {};
  document.querySelector("#pipelineCandidates").textContent = String(radarItems.length);
  document.querySelector("#pipelineSources").textContent = String(status.sources_total || 0);
  document.querySelector("#pipelineUpdated").textContent = status.generated_at ? new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Shanghai"}).format(new Date(status.generated_at)) : "尚未运行";
  const ingested = status.last_ingest?.count || 0;
  document.querySelector("#pipelineMessage").textContent = status.generated_at ? `本轮浏览器采集 ${ingested} 条，${status.sources_agent || 0} 个来源由每日 Codex 任务直接检查，${status.sources_error || 0} 个来源失败。` : "候选雷达等待首次采集，不影响已经验证的历史内容。";
}

function renderAtlas() {
  const atlasSignals = [...events.map(normalizedEvent), ...radarItems.map(normalizedRadar)].filter(item=>!isGithubSignal(item) && !isXSignal(item));
  const companies = [...atlasSignals.reduce((map,item) => {
    const current = map.get(item.company) || {name:item.company,en:item.companyEn || item.company,region:item.region,count:0,max:0,latest:eventDate(item)};
    current.count += 1; current.max = Math.max(current.max,Number(signalScore(item)) || 0); if(eventDate(item)>current.latest)current.latest=eventDate(item); map.set(item.company,current); return map;
  },new Map()).values()].sort((a,b)=>Number(isUnattributed(a.name)) - Number(isUnattributed(b.name)) || b.latest-a.latest || b.max-a.max);
  atlas.innerHTML = companies.map((item,index)=>`<button type="button" class="atlas-item" data-company="${item.name}"><span>${String(index+1).padStart(2,"0")}</span><div><strong>${item.name}</strong><small>${item.en}</small></div><em>${item.region === "cn" ? "CN+" : "GLOBAL"}</em><b>${item.count}</b></button>`).join("");
}

function selectCompany(company) {
  activeCompany = company;
  const item = [...events, ...radarItems].find(event => event.company === company);
  if (item) activeRegion = item.region;
  regionFilters.querySelectorAll("[data-region]").forEach(button => button.classList.toggle("active", button.dataset.region === activeRegion));
  render();
  document.querySelector("#briefing").scrollIntoView({behavior:"smooth"});
}

function openDetail(id) {
  const item = [...events, ...radarItems].find(event => event.id === id);
  if (!item) return;
  const verified = item.signal_type === "verified";
  const company = item.company || item.org || "未归属公司 / 研究机构";
  const category = item.label || item.kind || "实质进展";
  const score = signalScore(item);
  const evidence = verified ? `${item.evidence || "—"} 级 · ${item.confidence || "待核验"}` : `候选雷达 · ${item.source || "来源待核验"}`;
  const why = item.why || item.evidence_note || (item.taste_reasons || []).join("；") || "这条信息已通过相关性筛选，仍需结合原文和交叉来源判断。";
  const next = item.next || "回到原始来源核对事实、日期与后续确认。";
  dialogContent.innerHTML = `<article class="dialog-body"><div class="dialog-company"><span>${escapeHtml(item.companyEn || item.org || "")}</span><strong>${escapeHtml(company)}</strong></div><span class="category">${escapeHtml(category)}</span><h2 id="dialogTitle">${escapeHtml(item.title)}</h2><p class="lead">${escapeHtml(item.summary || "")}</p><div class="dialog-meta"><div><span>日期</span><strong>${escapeHtml(item.date || "")}</strong></div><div><span>重要度 / 相关性</span><strong>${escapeHtml(score)}</strong></div><div><span>证据与来源</span><strong>${escapeHtml(evidence)}</strong></div></div><section class="dialog-section"><h3>为什么重要</h3><p>${escapeHtml(why)}</p></section><section class="dialog-section"><h3>下一个观察点</h3><p>${escapeHtml(next)}</p></section><a class="source-link" href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noopener">打开原始来源 ↗</a></article>`;
  dialog.showModal();
}

regionFilters.addEventListener("click", event => {const button=event.target.closest("[data-region]");if(!button)return;activeRegion=button.dataset.region;activeCompany="all";regionFilters.querySelectorAll("[data-region]").forEach(x=>x.classList.toggle("active",x===button));render();});
weekFilters.addEventListener("click", event => {const button=event.target.closest("[data-week]");if(!button)return;activeWeek=button.dataset.week;activeCompany="all";renderWeekFilters();render();});
document.querySelector("#weeklyArchiveLinks")?.addEventListener("click", event => {const button=event.target.closest("[data-archive-week]");if(!button)return;activeWeek=button.dataset.archiveWeek;activeCompany="all";renderWeekFilters();render();document.querySelector("#briefing")?.scrollIntoView({behavior:"smooth"});});
topicFilters.addEventListener("click", event => {const button=event.target.closest("[data-topic]");if(!button)return;activeTopic=button.dataset.topic;topicFilters.querySelectorAll("[data-topic]").forEach(x=>x.classList.toggle("active",x===button));render();});
search.addEventListener("input",()=>{activeCompany="all";render();});
feed.addEventListener("click",event=>{const row=event.target.closest("[data-id]");if(row)openDetail(row.dataset.id);});
feed.addEventListener("keydown",event=>{const row=event.target.closest("[data-id]");if(row&&(event.key==="Enter"||event.key===" ")){event.preventDefault();openDetail(row.dataset.id);}});
atlas.addEventListener("click",event=>{const item=event.target.closest("[data-company]");if(item)selectCompany(item.dataset.company);});
document.querySelector(".dialog-close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
document.querySelector("#themeToggle").addEventListener("click",()=>{const current=document.documentElement.dataset.theme;const prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=current==="dark"||(!current&&prefersDark)?"light":"dark";});

document.querySelector("#statEvents").textContent=String(events.length + radarItems.length + insights.length).padStart(2,"0");
document.querySelector("#statCompanies").textContent=String(new Set([...events,...radarItems].map(x=>x.company)).size).padStart(2,"0");
document.querySelector("#statChina").textContent=String([...events,...radarItems,...insights].filter(x=>x.region==="cn").length).padStart(2,"0");
renderAtlas();
renderWeekFilters();
renderPipelineStatus();
render();

