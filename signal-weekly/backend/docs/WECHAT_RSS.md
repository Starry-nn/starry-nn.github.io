# SIGNAL 自建微信公众号 RSS

这条链路不依赖 Atlas：你自己的 WeRSS 实例负责在微信授权下维护公众号订阅和更新，SIGNAL 直接读取它的 JSON Feed，再执行账号白名单、日期窗口、价值评分、消费电子/八卦过滤和事件去重。Compose 默认使用 WeRSS 官方 Docker Hub 镜像；若所在网络能稳定访问 GHCR，也可以改回 `ghcr.io/rachelos/we-mp-rss:latest`。

## 1. 启动私有 WeRSS

```bash
cd signal-weekly/infra/wechat-rss
docker compose up -d
```

服务只绑定 `127.0.0.1:8001`，数据库保存在 `infra/wechat-rss/data/`，该目录已被 Git 忽略。打开 `http://127.0.0.1:8001`，立即修改默认管理员密码，然后进入「微信读书」页面，用个人微信扫码授权。当前 Compose 已固定使用 `GATHER.MODEL=weread_mp`，不要求你拥有公众号/服务号；授权过期时重新扫码即可。微信没有公开、无需授权的公众号 RSS API，因此首次扫码及授权续期不可省略。

微信读书通道的限制：它适合抓取已在微信读书中可访问的公众号新增文章；新版接口主要返回最新文章，历史文章回补能力有限，并受访问频率限制。需要抓哪些公众号，先在微信读书中关注/加入书架，再在 WeRSS 中确认对应 `MP_WXS_*` 源已导入。

## 2. 创建专用 Access Key

在 WeRSS 后台创建只给 SIGNAL 使用的 Access Key。将以下变量放到运行维护服务和每日任务的环境中，不要写入 `config/sources.json`、前端或 GitHub Pages：

```bash
export SIGNAL_WECHAT_RSS_URL=http://127.0.0.1:8001
export SIGNAL_WECHAT_RSS_ACCESS_KEY='你的 access key'
export SIGNAL_WECHAT_RSS_SECRET_KEY='你的 secret key'
```

模板位于 `infra/wechat-rss/signal.env.example`。WeRSS 使用 `Authorization: AK-SK access_key:secret_key`；SIGNAL 会在后端请求时动态生成这个请求头。

## 3. 核对并同步 63 个订阅

先做只读检查：

```bash
python3 signal-weekly/scripts/wechat_rss.py status
```

你也可以直接使用 WeRSS 后台导出的 CSV（需要包含 `id`、`公众号名称`、`faker_id`），这样个人微信/微信读书模式不需要公众平台搜索权限。下面命令会按 CSV 中的 `MP_WXS_*` 与 `faker_id` 批量导入，不会删除已有订阅：

```bash
python3 signal-weekly/scripts/wechat_rss.py sync --csv /path/to/公众号列表.csv --apply
```

如果个别名称与 SIGNAL 配置略有差异，脚本会处理已知别名（如 `雷锋网/雷峰网`、`智猿AI/智猩猩AI`、`AING硬选/AING硬迹`、`AI智伴/AI智件`）；其他名称会进入 `unresolved`，不会猜测或误加。CSV 中 `雷锋网` 与 `雷峰网` 虽会在名称统计中归一化，但两个不同的 `MP_WXS_*` 记录都会保留并分别采集。

## 4. 抓取与筛选

单独验证公众号来源：

```bash
python3 signal-weekly/scripts/collect.py --source wechat-rss --window-days 75
```

正常的全量采集仍使用：

```bash
python3 signal-weekly/scripts/collect.py --window-days 45
```

采集器从 `/feed/all.json` 分页读取最多 300 条，只接受配置中的账号。文章会先进入候选池；只有命中正式发布、模型/API/开源、重要组织与人才、战略融资并购、实质论文与代码、脑机/具身/芯片变化、政策或安全机制等新增信号，才可能进入页面。原文链接优先保留 `mp.weixin.qq.com`。

## 日常维护

- 每天 14:00 的 SIGNAL 任务应先运行直接采集，并检查 `wechat-rss` 状态是否为 `ok`。
- 若状态为 `error`，先检查容器：`docker compose ps` 和 `docker compose logs --tail=100`。
- 若服务正常但不再更新，登录 WeRSS 检查微信授权是否过期并重新扫码。
- 定期备份 `infra/wechat-rss/data/`；它包含订阅和服务状态，不应公开发布。
- Access Key 泄露时立即在 WeRSS 撤销并重建，更新运行环境变量。
- 不把本地 8001 或 SIGNAL 维护后台直接暴露到公网；需要跨机器运行时，用 HTTPS 反向代理和访问控制。
