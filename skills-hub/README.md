# Nan's Skills Desk

一个为 Nan 日常工作定制的 AI Skills 索引站。内容围绕投资研究、人物 mapping、飞书协作、人才库、会议纪要、报告交付、周报与自动化。

## 使用方式

直接打开 `index.html`，或通过 GitHub Pages 访问 `/skills-hub/`。

站点是纯静态 HTML、CSS 和 JavaScript，不需要构建步骤。

## 更新 Skills

编辑 `app.js` 中的 `skills` 数组。每个条目包含：

- `name`: Skill 的准确名称
- `title`: 中文功能名
- `category`: 页面分类
- `status`: `installed` 或 `available`
- `description`: 能力说明
- `when`: 推荐使用场景
- `prompt`: 一键复制的调用语
- `keywords`: 搜索补充词
