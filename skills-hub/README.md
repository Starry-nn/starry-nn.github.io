# Skills Desk

面向一级市场团队的公开与私人 AI Skills 仓库。公开目录按投资动作整理 Anthropic、OpenAI 与 Lark 生态能力；登录用户拥有相互隔离的私人仓库，可上传单个 Skill、下载单项或整库 ZIP，并生成可撤销的 Agent 访问令牌。

## 能力

- 公开目录：搜索、来源筛选、任务分类和调用语复制
- 账号系统：注册、登录、HttpOnly 会话、CSRF 防护、登录限速
- 私人仓库：用户级数据隔离、ZIP 校验、单项下载、整库打包
- Agent 接入：一次性显示的 Bearer Token、整库安装命令、上传 Prompt
- 管理员初始化：只通过环境变量注入密码哈希，首次登录强制改密

## 本地运行

需要 Python 3.9 或更高版本，无第三方依赖。

```bash
python3 scripts/generate_admin_credentials.py
```

将脚本输出的四个变量配置到本地 shell 或托管平台后运行：

```bash
python3 server.py
```

默认地址为 `http://127.0.0.1:8787`。私人功能必须通过 `server.py` 访问；直接打开 `index.html` 或只部署 GitHub Pages 只能浏览静态界面，不能提供安全的账号与私有存储。

## Skill ZIP 规范

每个 ZIP 必须只有一个 Skill 根目录：

```text
deal-screening/
├── SKILL.md
├── scripts/
├── references/
├── assets/
└── agents/
```

根目录使用小写字母、数字和短横线。`SKILL.md` 的 frontmatter 必须包含 `name` 和 `description`，且 `name` 与根目录一致。服务端拒绝路径穿越、符号链接、多个根目录和超限压缩包。

## 部署

仓库包含 `Dockerfile` 与 `railway.json`。在 Railway 部署时：

1. 挂载持久化 Volume 到 `/data`。
2. 配置凭据生成脚本输出的环境变量。
3. 让 Railway 注入 `PORT`，健康检查使用 `/api/health`。
4. 首次登录后立即修改管理员临时密码。

SQLite 数据库、私人 Skill 包、管理员变量和本地打包文件均已加入 `.gitignore`，不得提交到公开仓库。

## 验证

```bash
python3 -m unittest discover -s tests -v
node --check app.js
python3 -m json.tool catalog.json >/dev/null
```
