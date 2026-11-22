// Reviewed November 22, 2026. Conductor's official reversal supersedes its earlier notice.
(function () {
  const mem = {
  "id": "mem",
  "name": "Mem",
  "monogram": "M",
  "founded": "—",
  "ceased": "2027",
  "eventDate": "2026-11-16",
  "region": "global",
  "sector": "productivity",
  "outcome": "product-sunset",
  "location": "—",
  "peakValue": "—",
  "capital": "—",
  "confidence": "High",
  "accent": "graphite",
  "causeTags": [],
  "en": {
    "sectorLabel": "AI notes",
    "capitalLabel": "Undisclosed",
    "statusLabel": "Closure announced for January 15, 2027",
    "summary": "Mem announced its planned closure on November 16. Notes become read-only on December 18, with service access ending January 15, 2027.",
    "cause": "The founder announced the decision without giving a detailed business cause.",
    "lesson": "A note service needs a usable export path for the knowledge people have accumulated.",
    "timeline": [
      {
        "year": "November 16, 2026",
        "title": "Closure announced",
        "body": "Mem publishes the founder's notice."
      },
      {
        "year": "December 18, 2026",
        "title": "Read-only begins",
        "body": "Reading and export remain available under the plan."
      },
      {
        "year": "January 15, 2027",
        "title": "Access ends",
        "body": "Users are asked to download their notes beforehand."
      }
    ],
    "findings": [
      {
        "type": "fact",
        "title": "Billing paused",
        "body": "The notice says charging has stopped."
      },
      {
        "type": "inference",
        "title": "Migration is part of the exit",
        "body": "Users need time to check their exported knowledge."
      }
    ],
    "sources": [
      {
        "label": "Founder closure notice",
        "publisher": "Mem",
        "date": "2026-11-16",
        "url": "https://get.mem.ai/blog/mem-is-shutting-down",
        "primary": true
      }
    ]
  },
  "zh": {
    "sectorLabel": "AI 笔记",
    "capitalLabel": "未披露",
    "statusLabel": "已宣布于 2027 年 1 月 15 日关闭",
    "summary": "Mem 于 11 月 16 日宣布结束服务的安排。笔记将在 12 月 18 日转为只读，2027 年 1 月 15 日结束访问。",
    "cause": "创始人宣布了这一决定，未披露具体经营原因。",
    "lesson": "笔记服务结束时，应提供可用的导出路径，让用户带走积累的知识。",
    "timeline": [
      {
        "year": "2026 年 11 月 16 日",
        "title": "发布公告",
        "body": "Mem 发布创始人告别信。"
      },
      {
        "year": "2026 年 12 月 18 日",
        "title": "计划转为只读",
        "body": "按安排仍可阅读和导出。"
      },
      {
        "year": "2027 年 1 月 15 日",
        "title": "计划结束访问",
        "body": "用户需提前下载笔记。"
      }
    ],
    "findings": [
      {
        "type": "fact",
        "title": "已暂停收费",
        "body": "公告称已停止收费。"
      },
      {
        "type": "inference",
        "title": "迁移也是退出成本",
        "body": "用户需要时间检查导出的知识资料。"
      }
    ],
    "sources": [
      {
        "label": "创始人停服公告",
        "publisher": "Mem",
        "date": "2026-11-16",
        "url": "https://get.mem.ai/blog/mem-is-shutting-down",
        "primary": true
      }
    ]
  }
};
  window.AUTOPSY_CASES_2026 = window.AUTOPSY_CASES_2026.filter(item =>
    item.id !== "conductor-cloud" && item.id !== mem.id
  );
  window.AUTOPSY_CASES_2026.push(mem);
})();
