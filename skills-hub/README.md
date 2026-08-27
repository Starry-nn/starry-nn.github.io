# Skills Desk

面向一级市场团队的公开 Skills 目录与私人 Skills / Prompts 方法仓库。公开页面由 GitHub Pages 免费托管；账号、私有内容和 Agent API 运行在 Supabase Free。

## 能力

- 公开目录：搜索、来源筛选、任务分类和调用语复制
- 账号系统：注册、登录、临时管理员密码强制更新
- 私人仓库：用户级数据隔离、ZIP 校验、单项下载、整库打包
- Prompt 仓库：保留原文、内容辅助命名与分类、确认后入库、单项复制/下载与整库打包
- Prompt 版本：在线修改名称、元数据与原文；每次保存自动升级版本并保留旧版快照
- 只读共享：创建可过期、可撤销且只显示一次的仓库授权码；访客只能浏览、复制和下载
- 智能录入：Skill ZIP 和 Prompt 都先生成名称、说明、分类与使用信息，待用户修改确认后保存
- Agent 接入：一次性显示的 Bearer Token、整库安装命令、上传 Prompt
- 数据安全：Supabase 私有 Storage、服务端所有权检查、数据库 RLS 与最小权限

## 本地运行

需要 Python 3.9 或更高版本，无第三方依赖。

```bash
python3 scripts/generate_admin_credentials.py
```

将脚本输出的四个变量配置到本地 shell 后，可运行原始 Python 本地后端：

```bash
python3 server.py
```

默认地址为 `http://127.0.0.1:8787`。线上环境使用 `supabase/functions/skills-api`；`server.py` 仅作为无第三方依赖的本地开发后端。

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

## 免费部署

1. 创建 Supabase Free 项目并运行 `supabase/migrations`。
2. 给 Edge Function 配置凭据生成脚本输出的管理员变量。
3. 部署 `supabase/functions/skills-api`，其 JWT 验证关闭，由函数验证自有短期会话和可撤销 Agent Token。
4. 将项目 URL 与 publishable key 写入 `supabase-config.js`。publishable key 可公开；service-role key 永远不能进入浏览器或 GitHub。
5. GitHub Pages 继续发布 `skills-hub/` 静态文件。

Supabase Storage bucket 为 private，数据库表开启 RLS 且不授予客户端访问策略。所有私有文件操作必须经过 Edge Function 的账号所有权检查。

管理员可在本机设置 `SUPABASE_SERVICE_ROLE_KEY` 后运行 `scripts/import_private_bundles.py`，把被 Git 忽略的 ZIP 批量导入指定账号。该密钥只允许作为进程环境变量使用。

现有 Prompt library 可通过 `scripts/import_private_prompts.py` 导入指定账号；脚本保留每条 Prompt 正文，并把 frontmatter 作为独立检索元数据。

SQLite 数据库、私人 Skill 包、管理员变量和本地打包文件均已加入 `.gitignore`，不得提交到公开仓库。

## 验证

```bash
python3 -m unittest discover -s tests -v
node --check app.js
python3 -m json.tool catalog.json >/dev/null
```
