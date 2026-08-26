# Skills Desk

面向一级市场团队的公开与私人 AI Skills 仓库。公开目录由 GitHub Pages 免费托管；账号、私有 ZIP 和 Agent API 运行在 Supabase Free。登录用户拥有相互隔离的私人仓库，可上传单个 Skill、下载单项或整库 ZIP，并生成可撤销的 Agent 访问令牌。

## 能力

- 公开目录：搜索、来源筛选、任务分类和调用语复制
- 账号系统：注册、登录、临时管理员密码强制更新
- 私人仓库：用户级数据隔离、ZIP 校验、单项下载、整库打包
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

SQLite 数据库、私人 Skill 包、管理员变量和本地打包文件均已加入 `.gitignore`，不得提交到公开仓库。

## 验证

```bash
python3 -m unittest discover -s tests -v
node --check app.js
python3 -m json.tool catalog.json >/dev/null
```
