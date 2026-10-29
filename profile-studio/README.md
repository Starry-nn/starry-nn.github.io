# Profile Studio

A buildless GitHub profile README composer. Choose a layout, edit your details, and copy a working README. Chinese interface; English example profile.

## Run

From the workspace parent: `python3 -m http.server 8787 --bind 127.0.0.1 --directory profile-studio`.

Open http://127.0.0.1:8787/. A static server is required for native ES modules. No build or package installation is needed.

## Features

- Persistent first-use banner, quick-start help, and a shareable [Chinese beginner guide](./guide.html) covering both publishing paths, free editing, account safety, and troubleshooting.
- Fourteen original recipes, including simple, centered, wave, typing, badges, portfolio cards, compact, terminal, notebook, folded sections, banner showcase, live card, developer log, and quiet portfolio. Search templates by name or style.
- Two explicit completion paths: copy/download a fully resolved README for manual installation, or hand an approved task to an Agent.
- Share a base template and accent color through a link without embedding personal data. Custom source remains local and can be shared as a `.md` file.
- Edit profile, projects, skills, and website; hide or reorder sections.
- Six curated public resources with four directly usable integrations.
- Source cards include GitHub Star counts checked on 2026-10-28. Stars indicate community attention, not reviews or uptime guarantees. Personal READMEs linked from galleries are not automatically licensed for reuse.
- Shared HTML for preview and README export; no preview-only banners.
- Light/dark preview, source view, clipboard, README download, and local persistence.
- Free Markdown/HTML editor with sanitized live preview, local `.md` import, component insertion, and per-template drafts.
- Agent auto-fill: sample data stays in the browser; exports use explicit slots unless a field was manually pinned. An optional read-only Agent prompt and JSON import allow previewing real public profile data first.
- Agent handoff: a review dialog generates shell-quoted Codex / Claude Code launch commands or a generic prompt. Confirming copies an explicitly approved task limited to the authenticated user's profile README. Draft prompts/JSON packets remain unapproved.

## Agent handoff

1. Choose a recipe or edit its Markdown/HTML. Basic information defaults to Agent auto-fill; manually edited fields are preserved.
2. Select **交给 Agent**, review the target and scope, choose Codex CLI / Claude Code / generic chat and the correct shell, then confirm and copy.
3. Paste the command in a terminal with that Agent installed, or choose generic chat and paste the prompt into an existing Agent session. The Agent uses its own authorized GitHub access, resolves data slots, backs up an existing README, and updates only `{login}/{login}/README.md` with a fresh blob SHA.

The website does not launch a local process or hold GitHub credentials. The generated task still depends on the receiving Agent's capabilities, sign-in, network, permissions, and branch policies. Command syntax is verified against local `codex --help`, `claude --help`, [OpenAI documentation](https://developers.openai.com/codex/cli/reference), and [Claude Code documentation](https://code.claude.com/docs/en/cli-reference). Actual remote publishing is not executed as part of this demo's checks. For large free-edited files, download a draft handoff packet and give it to the Agent instead of using an oversized shell argument.

## Manual installation

Choose **自己复制 README**, verify the current fields are yours, and copy or download the resolved source. Create a public repository whose name exactly matches your GitHub login, then save the file as `README.md` at its root. This path requires no Agent or account connection to this website. Invalid usernames and unresolved custom variables block the export and explain what to fix.

The free editor supports common headings, paragraphs, lists, links, images, tables, fenced code, and GitHub-style HTML. It is a lightweight preview, not a complete GitHub Flavored Markdown implementation. It removes scripts, inline event handlers, unsupported embeds, and unsafe links from the live preview. Raw source is retained as user-editable README data, never executed as shell code. Imported personal READMEs must be yours or reusable under their own licenses; the gallery's CC0 license does not apply to every linked profile.

## Sources

| Source | Repository license | Use |
| --- | --- | --- |
| [Capsule Render](https://github.com/kyechan99/capsule-render) | MIT | Configured public SVG URL |
| [Readme Typing SVG](https://github.com/DenverCoder1/readme-typing-svg) | MIT | Configured public SVG URL |
| [Skill Icons](https://github.com/tandpfun/skill-icons) | MIT | Public icon URL; unsupported skills remain text |
| [Markdown Badges](https://github.com/Ileriayo/markdown-badges) | MIT | Badge convention, rendered via Shields.io |
| [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme) | CC0-1.0 | Linked inspiration directory |
| [Profile README Generator](https://github.com/rahuldkjain/github-profile-readme-generator) | Apache-2.0 | Linked external generator |

Repository licenses and documentation checked on 2026-10-28. No third-party implementation code or personal profile is copied; built-in recipes are original compositions using documented APIs. The inspiration directory's license does not license linked personal READMEs, logos, or artwork. External images are fetched from their original services, which receive the display text in their URLs. Used components are attributed in exported HTML comments.

GitHub controls final typography, spacing, sanitization, and image caching. Preview and export share HTML, without claiming pixel-exact GitHub rendering. Accent color applies to banners, typing text, and generic badges; it cannot style arbitrary README text. Public image services may be unavailable; the app reports loading failures without fabricating replacements.

## Verification

`node --test profile-studio/tests/*.mjs` (Node 22+; from the parent workspace).

No login, repository modification, or automatic publication occurs.
