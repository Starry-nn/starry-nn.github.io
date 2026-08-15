# SIGNAL editorial policy

## Source registry maintenance

Use `http://127.0.0.1:8765/admin` for routine source maintenance. The console supports search, add, edit, enable/disable, delete, export, and a single-source test run. Prefer **disable** when a feed is temporarily broken or no longer useful: disabled sources are excluded from collection and rebuilds, while their historical candidates remain traceable. Delete only when the registry entry itself is wrong or permanently obsolete.

Every change creates a timestamped copy of `config/sources.json` in `data/source-backups/` and an entry in `data/source-audit.jsonl`; the latest 20 backups are retained locally. Source IDs are stable identifiers and cannot be edited after creation. Never enter credentials or private tokens into a source URL—keep secrets in environment variables.

## Schedule and time model

- Run every day at 14:00 Asia/Shanghai.
- A calendar week starts Monday 00:00 and ends Sunday 23:59.
- Each run scans the last 36 hours and revisits the current Monday-to-run-time window so late-indexed reports are not missed.
- Store the event's actual publication or occurrence date. The page computes its Monday week automatically.
- Show the newest week first. Within a week, sort by event date descending, then importance descending.

## What belongs in SIGNAL

SIGNAL has three visibility lanes. The goal is high-density discovery with strict labeling, not a tiny list of only headline events:

The editor's taste is **verifiable new change**. Relevance alone is not enough. A public radar item must pass both the normal relevance score and `taste_score`, have a real publication/event date, and have a natural Chinese title and summary. English originals remain linked and may retain `original_title`; untranslated English leads stay in the backend.

Positive patterns include a formal model/API/open-weight release, a control or organization change, a strategic investment, a material provenance/safety/distribution mechanism, a substantive paper plus code, and a named first-hand technical or policy announcement. Reject gossip, rumors, emotional disputes, tutorials, roundups, stale resurfacing, and articles that add no new fact. Strip words such as “刚刚 / 重磅 / 骂声 / 震怒 / 炮轰 / 封神” from the display title and restate the verified change neutrally.

Use one item per underlying event. The primary company document, paper, code repository, regulator, or named first-hand statement wins the canonical slot; media and expert analysis belong in `corroborating_sources`. For example, “DeepSeek V4 Pro 正式版” and “DeepSeek-V4-Pro-0813 Publish” are one event, not two.

Every public radar item must carry `company`, `project`, and `kind`. The reading hierarchy is company → project → dated event. `kind` preserves the editorial marker that explains why the item qualifies: 模型正式发布、正式开源 / 代码更新、组织变化、战略融资、机制 / 政策更新、研究成果, or another equally concrete label. A media outlet is a source, never the company grouping.

- `events`: confirmed company, research, policy, financing, product, talent, or technical events. These retain the strict A/B evidence threshold.
- `insights`: attributed expert opinions, technical observations, independent tests, open-source releases, newsletter analysis, and substantive podcast claims. These must link to the named original source and must be visibly labeled as opinion, analysis, practice, interview, or research resource.
- `candidate radar`: every relevant, traceable lead that has not completed editorial verification. C-grade leads are allowed here when clearly labeled. Do not discard a useful lead merely because it is not yet promotable.

## High-density collection standard

Collection and publication use different thresholds:

- Candidate admission asks: "Is this relevant, attributable, recent, and potentially useful?" It does not require the item to be a major event.
- Homepage promotion asks: "Is the evidence sufficient, and does the item change a decision or understanding?"
- A quiet company announcement, a technical release note, a strong repository, a named hiring move, or a substantive expert post may stay in the radar even when it does not merit an `event`.
- Use one canonical item per underlying development. Add corroborating links instead of deleting all but the largest story.

Active-day discovery targets:

- 35 or more new deduplicated candidates per day and 120 or more per week across all lanes.
- At least 12 China/Chinese-participation candidates and 20 global candidates per active day when source material exists.
- Daily mix target: 8 company/strategy, 8 people/X, 5 research/papers, 5 product/model/tool, 4 capital/talent/policy, and 5 open-source/community candidates.
- These are audit targets, not quotas. A missed target requires a coverage-gap note naming which sources failed or were not checked; it never permits fabrication.
- Do not spend the whole run perfecting three stories. First build a broad candidate pool, then deepen the highest-value cluster.

Include events that change at least one of these:

- Frontier model capability, cost, openness, safety, or distribution.
- Agent infrastructure such as memory, browser execution, security, evaluation, or deployment.
- Chips, compute, energy, and data-center capacity that materially affect AI supply.
- Embodied intelligence with real technical, industrial, financing, deployment, or regulatory consequences.
- Brain-computer interfaces with peer-reviewed, clinical, regulatory, or material company evidence.
- Key executive or researcher moves that change an important lab, company, or Chinese talent network.
- Large financing, acquisition, IPO, policy, or customer events only when they change an industry's structure.

Exclude from `events` by default, but retain a traceable candidate when it still helps discovery:

- Consumer phone, laptop, camera, appliance, and generic gadget launches.
- Minor feature releases, benchmark-only marketing, event previews, and conference attendance without technical content.
- Routine financing without technical or market significance.
- Content farms, anonymous reposts, SEO summaries, and claims without a resolvable original source.
- Stories whose only value is novelty, virality, or a dramatic headline.

Do not exclude a useful expert post merely because it is not a company-level event. Put it in `insights` when it changes how a practitioner should understand a model, tool, workflow, research direction, market structure, or policy debate.

## Chinese-language discovery sources

Use these sources for discovery and industrial context. A media report does not replace primary evidence for a major factual claim.

1. 36氪: startups, financing, company operations, commercialization, and sector reporting.
2. 虎嗅: company strategy, commercial impact, controversy, and deeper industry interpretation.
3. 硅星人 / 硅星人Pro: Silicon Valley, Chinese founders and researchers, AI companies, capital, and talent networks.
4. 晚点 LatePost: major Chinese technology companies, organization, strategy, and high-value exclusives.
5. 雷峰网: AI infrastructure, chips, robotics, security, and technical industry reporting.
6. 量子位 / 新智元 / 机器之心: model and research discovery. Verify promotional claims independently.
7. 财新 / 第一财经 / 证券时报 / 上交所 / 港交所: regulation, markets, IPO, and financial facts.

## 自建微信公众号 RSS 发现层

63 个账号统一登记在 `config/sources.json` 的 `wechat-rss` 源中，由站点所有者自托管的 WeRSS 实例更新，SIGNAL 直接读取 `/feed/all.json`，不依赖 Atlas 页面或会话。它们是发现层，不是事实层：每条候选必须回到公众号原文、发布方公开网站、论文、代码、监管文件或第二权威媒体确认后，才可升级到首页。

- 公司 / 创投 /产业：月之暗面 Kimi、赛博禅心、晚点Auto、投资界、36氪、铅笔道、投中网、硬氪、晚点LatePost、Z Potentials、高榕创投、钛媒体、极客公园、Z Finance、云启资本、中科创星、Founder Park、暗涌Waves、Top华人科创社、蓝驰创投、投资界AI、独角兽早知道、光源资本、高瓴创投、顺为资本、红杉汇、真格基金、硅发布、36氪Pro、鲸犀、Monolith砺思资本、elsewhere别处发生。
- AI / 研究 / 开源：无问芯穹、量子位、智氪AI、APPSO、智能涌现、AING硬迹、新智元、新智核、AI智件、硅星人Pro、AI科技评论、量子位智库、机器之心、逛逛GitHub、智猩猩AI、后浪new。
- 机器人 / 芯片 / 脑机：沐曦股份MetaX、机器人前瞻、雷峰网、雷锋网、智东西、脑机接口社区、DeepTech深科技。
- 高校 / 人才与其他：21世纪经济报道、虎嗅APP、融了么、北京大学、清华大学、职场Bonus、申小飞、晚点AI。

采集器每次最多读取最新 300 条，并按发布日期窗口、账号白名单和既有 taste 规则筛选：正式模型/API/开源、组织与人才变化、战略融资/并购/IPO、实质论文与代码、脑机/具身/芯片的技术或产业变化、重要政策与安全机制；消费电子、八卦、情绪化标题、旧闻重述和无新增信息只留候选或直接丢弃。`雷峰网` 与 `雷锋网` 使用同一 canonical source。首次部署、授权、密钥和日常维护见 `docs/WECHAT_RSS.md`。

For WeChat public accounts:

- Prefer the original `mp.weixin.qq.com` article when it is publicly discoverable and stable.
- Record account name, article title, publication time, author, and original URL.
- If the original article cannot be reliably accessed, use the publisher's public website copy.
- A third-party repost can identify a lead, but cannot be the final evidence link unless no original exists and the item is marked B or C.
- Do not bypass login, access restrictions, paywalls, or anti-bot controls.

## Named expert and builder watchlist

Prioritize first-hand technical claims, releases, hiring, research, and strategic changes from these accounts. Commentary and predictions remain attributed opinions.

- Andrej Karpathy (@karpathy), Ilya Sutskever (@ilyasut), Andrew Ng (@AndrewYNg), Lilian Weng (@lilianweng), Jim Fan (@DrJimFan), Jeremy Howard (@jeremyphoward), Nathan Lambert (@natolambert), Phil Duan (@philduanai), Harrison Chase (@hwchase17), Guillermo Rauch (@rauchg), Pieter Levels (@levelsio), and swyx (@swyx).
- Also monitor consequential posts from founders, CEOs, CTOs, chief scientists, research leads, and principal engineers at OpenAI, Anthropic, Google DeepMind, Meta, xAI, NVIDIA, Microsoft, Apple, Amazon, Thinking Machines, SSI, Tesla, Figure, Physical Intelligence, 1X, Unitree, AgiBot, UBTECH, Moonshot AI, DeepSeek, Alibaba/Qwen, Tencent, ByteDance, Baidu, Zhipu, MiniMax, Huawei, and major chip companies.
- Never infer Chinese identity from a name. Record Chinese participation only when biography, employer, education, or the person's own public profile makes the connection explicit and relevant.
- Check every core named account directly on each daily run. Ilya Sutskever (@ilyasut) is a mandatory per-run check, including a no-new-post result when applicable. Do not rely only on web search indexing. If an X timeline is slow or blocked, use the person's canonical blog, newsletter, GitHub, company page, podcast transcript, or an authoritative page that embeds the original post. Never invent missing post text.

### X selection and display rules

- X is a first-class lane, not a fallback search surface. Each daily run checks `core-x` and `extended-x` directly and writes qualifying posts with `source_id`, `author`, `handle`, `published_at`, `company`/`project` when known, `title_zh`, `summary_zh`, and the original post URL.
- The X column accepts only original posts with a concrete technical release, research result, product/architecture change, hiring or organization change, policy/market fact, or a reproducible implementation detail. Replies, memes, engagement bait, generic predictions, repeated opinions, and unsourced screenshots stay out.
- Preserve attribution: a post is evidence that the named author said something, not automatic proof that the claim is true. For consequential claims, add a canonical company, paper, repository, filing, or authoritative media corroboration; keep the confidence boundary in `evidence_note`.
- English posts are translated into natural Chinese before display, while `original_title` and the original X URL remain in the record. X items never duplicate the same underlying event in the company lane.

## Newsletter and analysis radar

Use these to discover themes and strong analysis, then resolve consequential claims back to original evidence:

- Ben's Bites, The Rundown AI, TLDR AI, Import AI, The Batch, Superhuman AI, The Neuron, Latent Space, Interconnects, One Useful Thing, Unsupervised Learning, Stratechery, and Simon Willison's Weblog.
- AI Explained, Matthew Berman, Two Minute Papers, Yannic Kilcher, 3Blue1Brown, and Fireship for testing, paper discovery, technical explanation, and developer adoption signals.
- A newsletter or video recap alone is normally B or C evidence. Do not copy its framing when the underlying paper, release, transcript, or benchmark is available.

## Podcast and interview alerts

- Monitor 硅谷101, 晚点聊 LateTalk, a16z Podcast, YC podcasts and videos, Latent Space, and other high-quality founder or researcher interviews.
- In the daily completion report, flag new episodes that contain a relevant original claim, technical detail, or consequential interview. Do not add every new episode to the homepage.
- When an episode enters the homepage, link the publisher's canonical episode or transcript and name the speaker whose claim matters.

## Community and open-source radar

- Hacker News, GitHub Trending for AI/ML, Hugging Face models and datasets, Papers with Code, and focused Reddit communities including r/LocalLLaMA, r/MachineLearning, r/robotics, r/singularity, and company-specific communities.
- Community rank, votes, reposts, and comments measure attention, not truth. Use them to find projects, failures, replications, and dissenting evidence.
- Prefer a repository, release, paper, model card, issue, or maintainer statement as the final link. Anonymous community claims remain C and stay out of the homepage.
- Publish a daily `GitHub 华人相关活跃开源 Top 5`. Rank repositories with code activity that day from the explicitly curated Chinese organizations in `config/sources.json`. This is an activity list, not a claim that the repository was created that day. Never infer Chinese identity from contributor names. Every displayed entry needs a Chinese purpose summary, organization, update time, and Stars. Use `GITHUB_TOKEN` in the runtime when unauthenticated API limits make the daily list unreliable.

## International sources

- Primary: company newsroom, founder or executive public statement, paper, model card, GitHub release, regulator, exchange filing, court document, and research institution.
- High-value media: Reuters, Bloomberg / Bloomberg Law, Financial Times, The Information, Wall Street Journal, TechCrunch, Wired, The Verge, Axios, CNBC, and MIT Technology Review. Bloomberg is especially useful for IPO, financing, M&A, chips, and executive moves; paywalled text is never reconstructed, and only publicly verifiable facts are displayed.
- Individual sources: named founders, CEOs, CTOs, chief scientists, principal researchers, and investors with direct knowledge. Treat predictions and self-reported performance separately from facts.

## Evidence levels

- A: official document, regulator, paper, code release, named first-hand statement, or two independent authoritative sources.
- B: one authoritative original report, company self-report without independent validation, or a high-quality Chinese technology media exclusive.
- C: useful lead with incomplete confirmation. Keep in the research notes, not the homepage.

For `insights`, evidence grade describes attribution quality rather than whether the opinion is objectively true. A direct named post or canonical article is A for the fact that the person made that claim, while the card must still say `专家观点`, `实践观察`, `Newsletter 分析`, or another accurate type.

## Daily processing workflow

1. Run `scripts/collect.py` to gather machine-readable public sources. A source failure must be recorded in `data/status.json` without stopping the remaining sources.
2. Directly inspect every core expert account and use browser research for blocked sites, searchable WeChat originals, newsletters, podcasts, community radar, and sources that lack a stable feed. Process sources in six batches: company, people/X, research, product/open-source, capital/talent/policy, and podcasts/media.
3. Write browser discoveries to `data/inbox.json` using the schema in `data/inbox.example.json`, then run `scripts/ingest.py`.
4. Normalize title, company, people, date, region, topic, URL, and source type.
5. Cluster duplicate coverage into one candidate and retain the best original link plus corroborating links.
6. Reject consumer-product noise. Keep relevant low-confidence or lower-importance items in the candidate radar instead of silently dropping them.
7. Keep unverified items in the automatic candidate radar. A relevance score is not an evidence grade and must never be presented as factual confirmation.
8. Score importance independently from evidence quality. Promote only verified candidates into `events` or attributed observations into `insights`.
9. Write a concise Chinese summary, why it matters, and the next observable signal for promoted items.
10. Preserve older history and validate weekly grouping, newest-first order, source links, mobile layout, Python tests, and JavaScript syntax.
11. Report new high-value podcast episodes and unresolved C-grade leads separately.
12. Before finishing, compare counts with `coverage_targets` in `config/sources.json`. If the pool is below target, run a second discovery pass focused on missing lanes and China/global imbalance.
13. On an ordinary active news day, expect roughly 3-8 major events plus 5-15 useful observations across the verified lanes, backed by 35+ daily candidates. This is a coverage target, not a quota; never fabricate or lower attribution quality to reach it.
