# Startup Autopsy

Startup Autopsy 是一个中英双语的创业失败档案馆。它用公开材料还原公司停运、破产清算和核心产品下线的过程，并把可验证事实与编辑判断分开。

## 2026 coverage

- 数据更新至 2026-08-23。
- 当前共收录 19 份 2026 年公开可核验档案，其中 10 份来自中国，9 份来自海外。
- 收录标准包括法院已受理的破产清算、公司确认停运，以及核心产品正式下线。
- 普通裁员、未经证实的传闻和仍处于申请阶段的破产案件不纳入统计。
- 这是一份公开样本，不代表所有未公开或无法核验的失败项目。

## Features

- 中英文切换与独立中文排版系统
- 按年份、地区、行业和退出方式筛选
- 搜索与时间排序
- 2 至 3 个案例并排对比
- 深浅色主题
- 随机案例与可分享的案例链接
- 本地保存的社区线索表单

Startup Autopsy is an evidence-led archive of ambitious technology companies that shut down, sold off, or collapsed.

Instead of reducing failure to a single cause, each case file reconstructs the sequence of funding, product shifts, layoffs, strategic changes, and shutdown events. Verified facts are labeled separately from editorial inference.

![Startup Autopsy homepage](./assets/preview.jpg)

## What is included

- Four bilingual case files: Argo AI, Olive AI, Babylon Health, and Zume.
- Search and sector filters.
- Expandable case files with timelines, findings, lessons, and source links.
- English and Simplified Chinese interface.
- Light and dark themes.
- Shareable deep links such as `#case=argo-ai`.
- A local prototype flow for nominating future cases.

## Run locally

No build system or package installation is required.

```bash
python3 -m http.server 8080 --directory startup-autopsy
```

Then open `http://localhost:8080`.

## Editorial standard

1. Prefer primary sources such as regulatory filings and company statements.
2. Use contemporaneous reporting to reconstruct what was known at the time.
3. Separate verified facts from disputed claims and editorial inference.
4. Describe failure mechanisms without treating them as a definitive verdict.
5. Accept corrections when stronger evidence becomes available.

## Data structure

Cases live in `data/cases.js`. Each case contains shared metadata plus complete English and Chinese versions of:

- Summary
- Editorial diagnosis
- Timeline
- Findings
- Surviving lesson
- Sources

## Image asset

`assets/autopsy-desk.jpg` was generated for this project with OpenAI's built-in image generation tool. It contains no company logos or readable case text.

## Next milestones

- Move case data to portable JSON.
- Add source snapshots and link-health checks.
- Add a public contribution workflow through GitHub Issues.
- Add corrections and evidence-confidence history.
- Publish the archive with GitHub Pages.

## License

Code is available under the MIT License. Case summaries are original editorial work; linked source material remains the property of its respective publishers.
