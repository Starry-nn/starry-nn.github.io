// November 14 review: add Reka Clip and update Yuanqi with the primary notice.
(function () {
  const reka = {
  "id": "reka-clip",
  "name": "Reka Clip",
  "monogram": "RC",
  "founded": "—",
  "ceased": "2026",
  "eventDate": "2026-11-13",
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
    "sectorLabel": "AI video clipping",
    "capitalLabel": "Undisclosed",
    "statusLabel": "Product closure announced",
    "summary": "Reka set November 13 at 11:59 p.m. Pacific time as the end of access to its Clip product and existing videos. The notice establishes the deadline; the actual cutover was not independently tested.",
    "cause": "Reka disclosed the wind-down but gave no reason. The public notice concerns Clip specifically.",
    "lesson": "Publish separate deadlines for access to existing work, credit use and subscription refunds so users can plan the exit.",
    "timeline": [
      {
        "year": "Before November 13",
        "title": "New registrations close",
        "body": "Existing users retain account and video access until the deadline."
      },
      {
        "year": "November 13 PST",
        "title": "Scheduled end of access",
        "body": "Account access ends and remaining purchased credits expire under the notice."
      }
    ],
    "findings": [
      {
        "type": "fact",
        "title": "Refund rules differ",
        "body": "Eligible annual subscription payments can receive prorated refunds. Remaining purchased credits expire without refunds."
      },
      {
        "type": "inference",
        "title": "Saved videos are a migration dependency",
        "body": "Once account access ends, users may lose their only copy if they have not saved their work elsewhere."
      }
    ],
    "sources": [
      {
        "label": "Clip closure notice",
        "publisher": "Reka",
        "date": "Undated",
        "url": "https://creator.reka.ai/shutdown-announcement",
        "primary": true
      }
    ]
  },
  "zh": {
    "sectorLabel": "AI 视频剪辑",
    "capitalLabel": "未披露",
    "statusLabel": "已公告结束服务",
    "summary": "Reka 将太平洋时间 11 月 13 日晚 11:59 定为 Clip 账户及已有视频的最后访问时间。官方公告确认了期限，实际停服未独立测试。",
    "cause": "官方公告只涉及 Clip，未披露关闭原因。",
    "lesson": "停服公告应分别写清作品访问、点数使用和订阅退款的期限，方便用户安排迁移。",
    "timeline": [
      {
        "year": "11 月 13 日前",
        "title": "停止新用户注册",
        "body": "已有用户在截止前仍可访问账号和已有视频。"
      },
      {
        "year": "11 月 13 日（太平洋时间）",
        "title": "计划结束访问",
        "body": "按公告安排，账户访问结束，剩余付费点数到期。"
      }
    ],
    "findings": [
      {
        "type": "fact",
        "title": "订阅和点数的退款规则不同",
        "body": "符合条件的年付订阅按剩余使用期退款，剩余付费点数作废且不退款。"
      },
      {
        "type": "inference",
        "title": "已有视频也需要迁移",
        "body": "如果用户没有另外保存作品，账户关闭后可能失去手头唯一的一份视频。"
      }
    ],
    "sources": [
      {
        "label": "Clip 停服公告",
        "publisher": "Reka",
        "date": "Undated",
        "url": "https://creator.reka.ai/shutdown-announcement",
        "primary": true
      }
    ]
  }
};
  const yuanqiNotice = {label: "关于元器平台停止服务通知", publisher: "腾讯元器", date: "2026-10-08", url: "https://yuanqi.tencent.com/cl/service-discontinuation", primary: true};

  window.AUTOPSY_CASES_2026 = window.AUTOPSY_CASES_2026.filter(item => item.id !== reka.id).map(item => {
    if (item.id !== "tencent-yuanqi") return item;
    const en = {
      ...item.en,
      statusLabel: "Public homepage redirected to closure notice",
      summary: "Tencent scheduled the end of public Yuanqi platform services for November 9. Its homepage now leads to the official notice. The announced export window runs until January 9, 2027.",
      cause: "Tencent cited a business adjustment and provided migration guidance for ADP and WeChat Official Accounts. Detailed business drivers were not disclosed.",
      sources: [yuanqiNotice, ...item.en.sources]
    };
    const zh = {
      ...item.zh,
      statusLabel: "官网已跳转至停服公告",
      summary: "腾讯将 11 月 9 日定为元器平台公众服务的停止日期。官网首页已跳转至官方公告。按公告安排，数据导出过渡期截至 2027 年 1 月 9 日。",
      cause: "腾讯给出的原因是业务调整，并提供迁移至腾讯云 ADP 和公众号智能回复的指引。具体经营原因未披露。",
      sources: [yuanqiNotice, ...item.zh.sources]
    };
    return {...item, en, zh};
  });
  window.AUTOPSY_CASES_2026.push(reka);
})();
