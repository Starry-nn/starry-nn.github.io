#!/usr/bin/env python3
"""Collect, normalize, score, and deduplicate SIGNAL candidates.

The collector uses only the Python standard library. It never promotes a raw
candidate to a verified event. The generated data/feed.js is a transparent
radar layer for the website and an input for the daily editorial automation.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import email.utils
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "sources.json"
OUTPUT_JSON = ROOT / "data" / "candidates.json"
OUTPUT_JS = ROOT / "data" / "feed.js"
STATUS_JSON = ROOT / "data" / "status.json"
TRANSLATIONS_JSON = ROOT / "data" / "translations.json"
LOCAL_ENV = ROOT / "infra" / "wechat-rss" / ".env"

USER_AGENT = "SIGNAL-Intelligence/1.0 (+local editorial research)"


def load_local_env() -> None:
    """Load ignored local WeRSS credentials for scheduled/local runs.

    The collector is intentionally stdlib-only, so it does not depend on a
    dotenv package. Explicit environment variables still take precedence.
    """
    if not LOCAL_ENV.exists():
        return
    for raw_line in LOCAL_ENV.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_local_env()


AI_TERMS = {
    "ai", "artificial intelligence", "agent", "agents", "llm", "model", "模型", "智能体",
    "人工智能", "生成式", "multimodal", "reasoning", "inference", "training", "open weight",
    "open-weight", "foundation model", "transformer", "rlhf", "alignment", "mcp", "context window",
    "world model", "vision-language", "vlm", "diffusion", "benchmark", "evaluation", "evals",
    "distillation", "synthetic data", "mixture of experts", "moe", "token", "coding assistant",
    "copilot", "agentic", "rag", "tool use", "function calling", "推理模型", "多模态", "世界模型",
    "基座模型", "大模型", "开源模型", "开放权重", "蒸馏", "合成数据", "上下文", "评测",
}
ROBOT_TERMS = {"robot", "robotics", "humanoid", "embodied", "physical ai", "slam", "manipulation", "具身", "机器人", "人形", "自动驾驶", "灵巧手", "机器狗"}
BCI_TERMS = {"brain computer", "brain-computer", "bci", "neural interface", "neurotech", "neural decoder", "neuroprosthetic", "implant", "electrode", "脑机", "神经接口", "植入", "电极"}
CHIP_TERMS = {"chip", "semiconductor", "gpu", "tpu", "npu", "hbm", "foundry", "accelerator", "datacenter", "data center", "芯片", "半导体", "算力", "数据中心", "光模块"}
PEOPLE_TERMS = {"ceo", "cto", "founder", "cofounder", "researcher", "scientist", "joins", "appointed", "hired", "创始人", "首席科学家", "加入", "离职", "任命"}
BUSINESS_TERMS = {
    "funding", "financing", "acquisition", "acquire", "merger", "ipo", "partnership", "investment",
    "regulation", "policy", "safety", "copyright", "lawsuit", "export control", "revenue", "customer",
    "融资", "收购", "并购", "上市", "投资", "合作", "监管", "政策", "安全", "版权", "诉讼",
    "出口管制", "订单", "客户", "商业化", "量产",
}
# The editorial taste learned from the user's weekly hand-curated list: a
# consumer-facing noun (phone, laptop, camera) is not enough to reject an item
# when the actual event changes model capability, supply, compute, governance,
# ownership, or the competitive structure of the industry.
STRATEGIC_OVERRIDE_SIGNALS = {
    "ai model", "foundation model", "model weights", "open weight", "open-source", "open source",
    "api", "agent", "workflow", "benchmark", "evaluation", "training", "inference",
    "security", "safety", "risk report", "system card", "research", "paper", "论文",
    "supply chain", "memory chip", "dram", "semiconductor", "chip supplier", "供应链", "存储芯片",
    "data center", "datacenter", "compute", "infrastructure", "算力", "数据中心", "基础设施",
    "acquisition", "acquire", "merger", "ipo", "financing", "investment", "partnership",
    "hiring", "recruit", "organizational", "organization", "restructure", "product line",
    "收购", "并购", "上市", "融资", "投资", "合作", "招聘", "组织", "重组", "产品线",
    "苹果智能", "apple intelligence", "china market", "中国市场",
}
NOISE_TERMS = {"phone review", "smartphone", "camera sample", "unboxing", "手机评测", "开箱", "壁纸", "促销"}
HARD_NOISE_TERMS = {
    "smartphone", "robot phone", "ai phone", "手机", "荣耀robot phone", "laptop", "notebook pc",
    "camera", "television", "smart tv", "耳机", "笔记本电脑", "相机", "电视", "家电",
    "荣耀magicos", "magic os", "magicbook", "magicpad",
}
PROMO_TERMS = {
    "conference agenda", "event preview", "register now", "webinar", "summit agenda",
    "倒计时", "议程发布", "报名开启", "诚邀参加", "圆满落幕", "峰会举办", "大会召开", "确认出席",
}
CN_SIGNALS = {
    "china", "chinese", "中国", "华人", "qwen", "alibaba", "deepseek", "moonshot", "kimi",
    "bytedance", "tencent", "baidu", "zhipu", "minimax", "huawei", "unitree", "ubtech",
    "tsmc", "台积电", "阿里", "腾讯", "百度", "字节", "华为", "宇树", "优必选", "智元",
}

NOVELTY_SIGNALS = {
    "release", "released", "launch", "launched", "publish", "published", "open source", "open-source",
    "new model", "api update", "acquisition", "acquired", "merger", "spin out", "independent operation",
    "funding", "financing", "investment", "led the round", "watermark", "c2pa", "system card",
    "accepted", "paper", "dataset", "benchmark", "deployment", "clinical trial", "regulatory approval",
    "发布", "上线", "正式版", "开源", "开放权重", "更新", "恢复独立", "拆分", "收购", "并购",
    "融资", "投资", "领投", "水印", "内容凭证", "论文", "入选", "代码", "数据集", "部署",
    "量产", "临床", "获批", "监管", "任命", "加入", "离职",
}
LOW_VALUE_SIGNALS = {
    "rumor", "reportedly", "gossip", "recap", "roundup", "weekly digest", "what is", "how to",
    "传闻", "网传", "爆料", "盘点", "汇总", "回顾", "一文看懂", "教程", "科普", "围观",
}
SENSATIONAL_SIGNALS = {"刚刚", "重磅", "炸裂", "骂声", "震怒", "急了", "封神", "逆天", "大瓜"}
# These phrases identify a dispute or emotional framing, rather than a new,
# independently traceable technical or organizational change.  Do not surface
# them in the public radar merely because the source itself is technology
# related.  Neutral rewrites of otherwise qualifying releases belong in
# translations.json instead.
EDITORIAL_EXCLUSION_SIGNALS = {"严重侮辱", "烂代码", "骂战", "口水战", "单挑老东家"}
GENERIC_CONTENT_SIGNALS = {"播客更新了", "播客更新", "本期对话", "podcast episode", "newsletter update"}


def contains_cjk(value: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", value or ""))


def taste_score(item: dict) -> tuple[int, list[str]]:
    text = f"{item.get('title', '')} {item.get('summary', '')}".lower()
    reasons, score = [], 0
    novelty_hits = [term for term in NOVELTY_SIGNALS if term in text]
    if novelty_hits:
        score += min(5, 2 + len(novelty_hits))
        reasons.append("有可验证的新增动作")
    strategic_hits = [term for term in STRATEGIC_OVERRIDE_SIGNALS if term in text]
    if strategic_hits:
        score += min(4, 1 + len(strategic_hits) // 2)
        reasons.append("影响能力、算力、供应链或组织结构")
    if item.get("source_type") in {"github_cn", "arxiv"} or "research" in item.get("topics", []):
        score += 1
        reasons.append("研究或开源进展")
    if item.get("tier") == "A":
        score += 1
        reasons.append("一手或A级来源")
    if any(term in text for term in LOW_VALUE_SIGNALS):
        # High-tier reporting about a strategic move is still useful as a
        # radar lead, but it must remain explicitly labelled as unconfirmed.
        if strategic_hits and item.get("tier") in {"A", "B"}:
            score -= 1
            reasons.append("高价值但仍待核实，保留为雷达线索")
        else:
            score -= 4
            reasons.append("疑似传闻、回顾或教程")
    if item.get("date_inferred"):
        score -= 3
        reasons.append("发布日期未确认")
    if not novelty_hits and any(term in text for term in SENSATIONAL_SIGNALS):
        score -= 3
        reasons.append("只有情绪化包装，缺少新增事实")
    return score, reasons


def event_key(item: dict) -> str:
    text = f"{item.get('title', '')} {item.get('summary', '')}".lower()
    if re.search(r"deepseek.{0,30}v4.{0,20}pro|v4.{0,20}pro.{0,30}deepseek", text):
        return "deepseek-v4-pro-0813"
    words = re.findall(r"[a-z0-9]+", text)
    stop = {"the", "a", "an", "and", "for", "with", "from", "new", "release", "released", "publish", "published", "update", "updated"}
    return " ".join(sorted(set(words) - stop)[:12])


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_now() -> str:
    return utc_now().replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch(url: str, timeout: int = 18, extra_headers: Optional[dict[str, str]] = None) -> tuple[bytes, str]:
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if "api.github.com" in url and os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    if extra_headers:
        headers.update(extra_headers)
    request = urllib.request.Request(url, headers=headers)
    host = urllib.parse.urlsplit(url).hostname or ""
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({})) if host in {"127.0.0.1", "localhost"} else None
    open_request = opener.open if opener is not None else urllib.request.urlopen
    with open_request(request, timeout=timeout) as response:
        return response.read(), response.headers.get("Content-Type", "")


def clean_text(value: Optional[str]) -> str:
    if not value:
        return ""
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def first_text(node: ET.Element, names: tuple[str, ...]) -> str:
    for child in node.iter():
        tag = child.tag.rsplit("}", 1)[-1].lower()
        if tag in names and child.text:
            return clean_text("".join(child.itertext()))
    return ""


def parse_date(value: str, fallback: Optional[dt.datetime] = None) -> dt.datetime:
    fallback = fallback or utc_now()
    value = (value or "").strip()
    if not value:
        return fallback
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed:
            return parsed.replace(tzinfo=parsed.tzinfo or dt.timezone.utc).astimezone(dt.timezone.utc)
    except (TypeError, ValueError, OverflowError):
        pass
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = dt.datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except ValueError:
        return fallback


def canonical_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    query = [(k, v) for k, v in query if not k.lower().startswith("utm_") and k.lower() not in {"ref", "source"}]
    path = re.sub(r"/+$", "", parsed.path) or "/"
    return urllib.parse.urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), path, urllib.parse.urlencode(query), ""))


def make_id(url: str, title: str) -> str:
    return hashlib.sha1(f"{canonical_url(url)}|{title.lower()}".encode("utf-8")).hexdigest()[:16]


def infer_topics(text: str, defaults: list[str]) -> list[str]:
    lower = text.lower()
    topics = set(defaults)
    if any(term in lower for term in AI_TERMS): topics.add("ai")
    if any(term in lower for term in ROBOT_TERMS): topics.add("robotics")
    if any(term in lower for term in BCI_TERMS): topics.add("bci")
    if any(term in lower for term in CHIP_TERMS): topics.add("chips")
    if any(term in lower for term in PEOPLE_TERMS): topics.add("people")
    return sorted(topics)


def is_relevant(text: str, source_topics: list[str], source: Optional[dict] = None) -> bool:
    lower = text.lower()
    if any(term in lower for term in GENERIC_CONTENT_SIGNALS) and not any(term in lower for term in STRATEGIC_OVERRIDE_SIGNALS):
        return False
    hard_noise = any(term in lower for term in HARD_NOISE_TERMS)
    strategic_exception = any(term in lower for term in STRATEGIC_OVERRIDE_SIGNALS)
    # Keep generic handset/consumer-electronics coverage out, while allowing
    # strategic stories such as Apple–Alibaba model work or CXMT memory supply.
    if hard_noise and not strategic_exception:
        return False
    if any(term in lower for term in PROMO_TERMS):
        return False
    if any(term in lower for term in NOISE_TERMS) and not any(term in lower for term in AI_TERMS | ROBOT_TERMS | BCI_TERMS | CHIP_TERMS):
        return False
    terms = AI_TERMS | ROBOT_TERMS | BCI_TERMS | CHIP_TERMS
    has_core_topic = bool(any(term in lower for term in terms) or set(source_topics) & {"ai", "robotics", "bci", "chips"})
    has_business_signal = any(term in lower for term in BUSINESS_TERMS | PEOPLE_TERMS)
    business_source = bool(set(source_topics) & {"company", "startup", "people", "policy", "capital"})
    return has_core_topic or (has_business_signal and business_source)


def is_public_radar_item(item: dict) -> bool:
    """Keep opinion-led conflict headlines out of the public candidate lane."""
    title = clean_text(str(item.get("title", ""))).lower()
    return not any(term in title for term in EDITORIAL_EXCLUSION_SIGNALS)


def is_display_ready(item: dict) -> bool:
    """Public reading cards require Chinese display copy; raw leads stay internal."""
    title = clean_text(str(item.get("title_zh") or item.get("title") or ""))
    summary = clean_text(str(item.get("summary_zh") or item.get("summary") or ""))
    return contains_cjk(title) and (not summary or contains_cjk(summary))


def infer_region(text: str, hint: str) -> str:
    lower = text.lower()
    if hint == "cn" or any(term in lower for term in CN_SIGNALS):
        return "cn"
    return "global"


def score_item(item: dict, source: dict, now: dt.datetime) -> tuple[int, list[str]]:
    tier_score = {"A": 38, "B": 29, "C": 18}.get(source.get("tier", "C"), 18)
    age_hours = max(0.0, (now - parse_date(item["published_at"])).total_seconds() / 3600)
    recency = max(0, round(22 - age_hours / 18))
    topic_score = min(24, 7 * len(set(item["topics"]) & {"ai", "robotics", "bci", "chips", "people"}))
    cn_score = 7 if item["region"] == "cn" else 0
    engagement = min(12, int(item.get("engagement", 0) ** 0.5))
    inferred_date_penalty = 8 if item.get("date_inferred") else 0
    score = min(100, tier_score + recency + topic_score + cn_score + engagement - inferred_date_penalty)
    reasons = [f"{source.get('tier', 'C')}级来源", f"{len(item['topics'])} 个主题命中"]
    if recency >= 14: reasons.append("近期发布")
    if cn_score: reasons.append("中国及华人关联")
    if engagement: reasons.append("社区关注")
    if inferred_date_penalty: reasons.append("网页日期待确认")
    return score, reasons


def base_item(source: dict, title: str, url: str, summary: str, published: dt.datetime, engagement: int = 0, date_inferred: bool = False) -> Optional[dict]:
    title = clean_text(title)
    summary = clean_text(summary)
    if not title or not url:
        return None
    combined = f"{title} {summary}"
    if not is_relevant(combined, source.get("topics", []), source):
        return None
    topics = infer_topics(combined, source.get("topics", []))
    region = infer_region(combined, source.get("region", "global"))
    url = canonical_url(urllib.parse.urljoin(source["url"], url))
    if urllib.parse.urlsplit(url).scheme not in {"http", "https"}:
        return None
    item = {
        "id": make_id(url, title), "title": title, "summary": summary[:520], "url": url,
        "published_at": published.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "date": published.astimezone(dt.timezone(dt.timedelta(hours=8))).strftime("%m.%d"),
        "source_id": source["id"], "source": source["name"], "source_type": source["type"],
        "tier": source.get("tier", "C"), "region": region, "topics": topics, "engagement": engagement,
        "date_inferred": date_inferred,
        "language": "zh" if contains_cjk(f"{title} {summary}") else "en",
    }
    item["score"], item["score_reasons"] = score_item(item, source, utc_now())
    item["taste_score"], item["taste_reasons"] = taste_score(item)
    item["event_key"] = event_key(item)
    return item


def parse_feed(data: bytes, source: dict) -> list[dict]:
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        # Some otherwise useful publisher feeds contain HTML named entities,
        # stray control bytes, or bare ampersands. Repair only those common
        # syndication defects, then let ElementTree validate the result again.
        text = data.decode("utf-8", errors="replace")
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
        text = re.sub(
            r"&([A-Za-z][A-Za-z0-9]+);",
            lambda match: match.group(0) if match.group(1) in {"amp", "lt", "gt", "quot", "apos"}
            else f"&#{html.entities.name2codepoint.get(match.group(1), 32)};",
            text,
        )
        text = re.sub(r"&(?!#\d+;|#x[0-9A-Fa-f]+;|amp;|lt;|gt;|quot;|apos;)", "&amp;", text)
        root = ET.fromstring(text.encode("utf-8"))
    entries = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1].lower() in {"item", "entry"}]
    items = []
    for entry in entries:
        title = first_text(entry, ("title",))
        summary = first_text(entry, ("description", "summary", "content"))
        date_value = first_text(entry, ("pubdate", "published", "updated", "date"))
        link = ""
        for node in entry.iter():
            if node.tag.rsplit("}", 1)[-1].lower() == "link":
                link = node.attrib.get("href") or clean_text(node.text)
                if link: break
        item = base_item(source, title, link, summary, parse_date(date_value))
        if item: items.append(item)
    return items


def normalize_wechat_account(value: str) -> str:
    value = re.sub(r"[\s·•_\-—/]+", "", clean_text(value)).lower()
    return {
        "雷锋网": "雷峰网",
        "智猿ai": "智猩猩ai",
        "aing硬选": "aing硬迹",
        "ai智伴": "ai智件",
    }.get(value, value)


def wechat_rss_headers() -> dict[str, str]:
    access_key = os.environ.get("SIGNAL_WECHAT_RSS_ACCESS_KEY", "").strip()
    secret_key = os.environ.get("SIGNAL_WECHAT_RSS_SECRET_KEY", "").strip()
    if bool(access_key) != bool(secret_key):
        raise ValueError("SIGNAL_WECHAT_RSS_ACCESS_KEY and SIGNAL_WECHAT_RSS_SECRET_KEY must be set together")
    return {"Authorization": f"AK-SK {access_key}:{secret_key}"} if access_key else {}


def wechat_rss_endpoint(source: dict) -> str:
    configured = os.environ.get("SIGNAL_WECHAT_RSS_URL", "").strip() or source.get("url", "")
    if not configured:
        raise ValueError("WeChat RSS URL is not configured")
    if configured.rstrip("/").endswith(".json"):
        return configured
    return configured.rstrip("/") + "/feed/all.json"


def collect_wechat_rss(source: dict) -> list[dict]:
    """Read articles from the user's own WeRSS JSON feed, never from Atlas."""
    endpoint = wechat_rss_endpoint(source)
    headers = wechat_rss_headers()
    page_size = max(1, min(int(source.get("page_size", 100)), 500))
    pages = max(1, min(int(source.get("pages", 3)), 10))
    allowed_accounts = {normalize_wechat_account(name) for name in source.get("accounts", [])}
    items, seen = [], set()
    for page in range(pages):
        query = urllib.parse.urlencode({"limit": page_size, "offset": page * page_size})
        separator = "&" if "?" in endpoint else "?"
        payload = json.loads(fetch(f"{endpoint}{separator}{query}", extra_headers=headers)[0])
        entries = payload.get("items", payload if isinstance(payload, list) else [])
        if not isinstance(entries, list):
            raise ValueError("WeRSS JSON response does not contain an items list")
        for entry in entries:
            feed = entry.get("feed") if isinstance(entry.get("feed"), dict) else {}
            publisher = clean_text(entry.get("channel_name") or feed.get("name") or source["name"])
            if allowed_accounts and normalize_wechat_account(publisher) not in allowed_accounts:
                continue
            url = entry.get("link") or entry.get("url") or ""
            key = canonical_url(url) if url else str(entry.get("id", ""))
            if not key or key in seen:
                continue
            seen.add(key)
            summary = entry.get("description") or entry.get("content") or ""
            published = parse_date(str(entry.get("updated") or entry.get("published_at") or ""))
            item = base_item(source, entry.get("title", ""), url, summary, published)
            if item:
                item["source"] = publisher
                item["wechat_account"] = publisher
                item["primary_source"] = urllib.parse.urlsplit(item["url"]).netloc.lower() == "mp.weixin.qq.com"
                items.append(item)
        if len(entries) < page_size:
            break
    return items


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href = ""
        self._parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self._href = dict(attrs).get("href", "")
            self._parts = []

    def handle_data(self, data):
        if self._href:
            self._parts.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href:
            text = clean_text(" ".join(self._parts))
            if text:
                self.links.append((self._href, text))
            self._href, self._parts = "", []


def collect_html(source: dict) -> list[dict]:
    data, _ = fetch(source["url"])
    parser = LinkParser()
    parser.feed(data.decode("utf-8", errors="ignore"))
    allowed = set(source.get("allow_domains", []))
    seen, items = set(), []
    for href, title in parser.links:
        url = canonical_url(urllib.parse.urljoin(source["url"], href))
        domain = urllib.parse.urlsplit(url).netloc.lower()
        if allowed and not any(domain == value or domain.endswith("." + value) for value in allowed):
            continue
        if url in seen or len(title) < 12 or len(title) > 180:
            continue
        seen.add(url)
        item = base_item(source, title, url, "", utc_now(), date_inferred=True)
        if item: items.append(item)
    return items[:40]


def collect_hn(source: dict) -> list[dict]:
    ids = json.loads(fetch(source["url"])[0])[:int(source.get("story_limit", 50))]
    items = []
    for story_id in ids:
        try:
            story = json.loads(fetch(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json", timeout=8)[0])
        except Exception:
            continue
        if not story or story.get("type") != "story": continue
        url = story.get("url") or f"https://news.ycombinator.com/item?id={story_id}"
        item = base_item(source, story.get("title", ""), url, "", dt.datetime.fromtimestamp(story.get("time", time.time()), dt.timezone.utc), story.get("score", 0))
        if item: items.append(item)
    return items


def collect_huggingface(source: dict) -> list[dict]:
    payload = json.loads(fetch(source["url"])[0])
    items = []
    for model in payload:
        likes = int(model.get("likes", 0) or 0)
        downloads = int(model.get("downloads", 0) or 0)
        if likes < int(source.get("min_likes", 0)) and downloads < int(source.get("min_downloads", 0)):
            continue
        model_id = model.get("modelId") or model.get("id", "")
        tags = " ".join(model.get("tags", []))
        title = f"{model_id} updated on Hugging Face"
        summary = f"Tags: {tags}" if tags else ""
        published = parse_date(model.get("lastModified", ""))
        item = base_item(source, title, f"https://huggingface.co/{model_id}", summary, published, likes)
        if item:
            item["downloads"] = downloads
            items.append(item)
    return items


def collect_github(source: dict, since: str) -> list[dict]:
    url = source["url"].replace("{since}", since)
    payload = json.loads(fetch(url)[0])
    items = []
    for repo in payload.get("items", []):
        if int(repo.get("stargazers_count", 0) or 0) < int(source.get("min_stars", 0)):
            continue
        title = f"{repo['full_name']}: {repo.get('description') or 'AI repository update'}"
        item = base_item(source, title, repo["html_url"], repo.get("description") or "", parse_date(repo.get("pushed_at", "")), repo.get("stargazers_count", 0))
        if item: items.append(item)
    return items


def collect_github_cn(source: dict, since: str) -> list[dict]:
    """Daily Top 5 from explicitly curated Chinese teams; never infer ethnicity from names."""
    # The rest of the collector may look back 45 days, but this lane is a rolling
    # daily list. Do not accidentally turn it into a monthly popularity chart.
    since = (utc_now() - dt.timedelta(hours=24)).date().isoformat()
    repos = {}
    for org in source.get("organizations", [])[:int(source.get("organization_limit", 8))]:
        query = urllib.parse.urlencode({
            "q": f"org:{org} pushed:>={since}", "sort": "stars", "order": "desc", "per_page": 5,
        })
        payload = json.loads(fetch(f"https://api.github.com/search/repositories?{query}")[0])
        for repo in payload.get("items", []):
            repos[repo["full_name"]] = repo
    ranked = sorted(repos.values(), key=lambda repo: (int(repo.get("stargazers_count", 0)), repo.get("pushed_at", "")), reverse=True)
    items = []
    for repo in ranked:
        rank = len(items) + 1
        stars = int(repo.get("stargazers_count", 0) or 0)
        description = clean_text(repo.get("description") or "")
        title = f"GitHub 华人相关当日 Top {rank}：{repo['full_name']}"
        summary = f"由已确认的中国团队/机构 {repo['owner']['login']} 维护，今日有代码更新；累计 {stars:,} Stars。"
        if description:
            summary += f" 原始项目说明：{description}"
        item = base_item(source, title, repo["html_url"], summary, parse_date(repo.get("pushed_at", "")), stars)
        if item:
            item.update({"github_rank": rank, "github_org": repo["owner"]["login"], "original_summary": description, "translation_ready": not description or contains_cjk(description)})
            items.append(item)
        if len(items) >= 5:
            break
    return items


def collect_source(source: dict, since: str) -> list[dict]:
    source_type = source["type"]
    if source_type == "agent": return []
    if source_type == "rss" or source_type == "arxiv": return parse_feed(fetch(source["url"])[0], source)
    if source_type == "wechat_rss": return collect_wechat_rss(source)
    if source_type == "html": return collect_html(source)
    if source_type == "hn": return collect_hn(source)
    if source_type == "huggingface": return collect_huggingface(source)
    if source_type == "github": return collect_github(source, since)
    if source_type == "github_cn": return collect_github_cn(source, since)
    raise ValueError(f"Unsupported source type: {source_type}")


def title_key(title: str) -> str:
    return re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "", title.lower())


def deduplicate(items: list[dict]) -> list[dict]:
    kept: list[dict] = []
    urls, event_keys = set(), set()
    def source_priority(value: dict) -> tuple:
        official_domains = {"api-docs.deepseek.com", "manus.im", "anthropic.com", "support.claude.com", "openaccess.thecvf.com"}
        domain = urllib.parse.urlsplit(value.get("url", "")).netloc.lower()
        official = bool(value.get("primary_source")) or domain in official_domains or any(domain.endswith("." + d) for d in official_domains)
        chinese_ready = bool(value.get("language") != "en" or value.get("translation_ready") or value.get("title_zh"))
        structured = bool(value.get("company") and value.get("project") and value.get("kind"))
        return bool(official), structured, chinese_ready, value.get("tier") == "A", int(value.get("score", 0) or 0), value.get("published_at", "")

    for item in sorted(items, key=source_priority, reverse=True):
        url = canonical_url(item["url"])
        semantic_key = item.get("event_key") or event_key(item)
        if url in urls: continue
        key = title_key(item["title"])
        duplicate = None
        for existing in kept:
            if semantic_key and semantic_key == (existing.get("event_key") or event_key(existing)):
                duplicate = existing
                break
            if SequenceMatcher(None, key, title_key(existing["title"])).ratio() >= 0.86:
                duplicate = existing
                break
        if duplicate:
            duplicate.setdefault("corroborating_sources", []).append({"source": item["source"], "url": item["url"]})
            continue
        urls.add(url)
        event_keys.add(semantic_key)
        kept.append(item)
    return sorted(kept, key=lambda value: value["published_at"], reverse=True)


def cap_sources(items: list[dict], config: dict) -> list[dict]:
    """Prevent a bulk/community source from crowding out the intelligence mix."""
    defaults = config.get("source_item_caps", {})
    default_cap = int(defaults.get("default", 40))
    caps = {source["id"]: int(source.get("max_items", default_cap)) for source in config["sources"]}
    counts: dict[str, int] = {}
    kept = []
    for item in sorted(items, key=lambda value: (value["published_at"], value["score"]), reverse=True):
        source_id = item.get("source_id", "")
        if counts.get(source_id, 0) >= caps.get(source_id, default_cap):
            continue
        counts[source_id] = counts.get(source_id, 0) + 1
        kept.append(item)
    return kept


STRUCTURED_COMPANY_RULES = [
    (r"deepseek", "DeepSeek"), (r"manus", "Manus"), (r"anthropic|claude", "Anthropic"),
    (r"openai|chatgpt", "OpenAI"), (r"google deepmind|gemini|deepmind", "Google DeepMind"),
    (r"meta|llama|glimmer", "Meta"), (r"microsoft", "Microsoft"), (r"nvidia|blackwell|bluefield|vera", "NVIDIA"),
    (r"qwen|qwenlm|alibaba|阿里", "阿里通义 / Qwen"), (r"openbmb|minicpm|voxcpm", "OpenBMB"),
    (r"paddlepaddle|paddleformers", "百度飞桨"), (r"tencent|腾讯", "腾讯"),
    (r"unitree|宇树", "宇树科技"), (r"ubtech|优必选", "优必选"),
    (r"daimon|戴盟", "戴盟机器人"), (r"vercel|zero", "Vercel"),
    (r"spacex|cursor|anysphere|xai|grok", "SpaceX / xAI / Cursor"),
    (r"glm-5|z\.ai|zhipu|智谱", "智谱 AI / Z.ai"),
    (r"ling-3|antling|蚂蚁百灵", "蚂蚁集团 / Ant Ling"),
    (r"sensenova|sense.?time|商汤", "商汤科技 / SenseNova"),
    (r"cxmt|changxin|长鑫", "长鑫存储 / CXMT"),
    (r"apple|苹果", "Apple"),
]


def structured_fields(item: dict) -> dict:
    """Guarantee the public radar contract without pretending a media outlet is a company."""
    text = f"{item.get('title', '')} {item.get('summary', '')} {item.get('source_id', '')}".lower()
    company = clean_text(str(item.get("company", "")))
    project = clean_text(str(item.get("project", "")))
    kind = clean_text(str(item.get("kind", "")))
    if not company:
        for pattern, value in STRUCTURED_COMPANY_RULES:
            if re.search(pattern, text, re.I):
                company = value
                break
    if not company and item.get("source_type") in {"github", "github_cn"}:
        company = clean_text(str(item.get("github_org", "")))
    if not company and item.get("source_type") == "arxiv":
        company = "论文 / 研究团队"
    if not company:
        company = "未归属公司 / 研究机构"
    if not project:
        project = clean_text(str(item.get("title_zh") or item.get("title") or "未命名项目"))[:120]
    if not kind:
        if re.search(r"融资|投资|funding|financing|acquisition|收购|并购", text, re.I):
            kind = "战略融资 / 组织变化"
        elif re.search(r"招聘|hiring|recruit|data.?center|数据中心|算力|compute", text, re.I):
            kind = "算力 / 基础设施扩张"
        elif re.search(r"开源|open.?source|github|代码|repository|repo", text, re.I):
            kind = "正式开源 / 代码更新"
        elif re.search(r"论文|paper|research|arxiv|benchmark|评测|评估", text, re.I):
            kind = "研究成果"
        elif re.search(r"安全|watermark|c2pa|监管|policy|政策|临床", text, re.I):
            kind = "机制 / 政策更新"
        elif re.search(r"离开|加入|任命|独立运营|拆分", text, re.I):
            kind = "组织变化"
        elif re.search(r"发布|上线|launch|release|introduc|model", text, re.I):
            kind = "正式发布"
        else:
            kind = "实质技术进展"
    return {"company": company, "project": project, "kind": kind}


def meets_source_quality(item: dict, source: dict) -> bool:
    engagement = int(item.get("engagement", 0) or 0)
    if source.get("type") == "huggingface" and engagement < int(source.get("min_likes", 0)) and int(item.get("downloads", 0) or 0) < int(source.get("min_downloads", 0)):
        return False
    if source.get("type") in {"github", "github_cn"} and engagement < int(source.get("min_stars", 0)):
        return False
    if item.get("date_inferred") and source.get("type") == "agent":
        return False
    return True


def write_outputs(items: list[dict], runs: list[dict], window_days: int) -> None:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    min_score = int(config.get("candidate_min_score", 25))
    min_taste = int(config.get("taste_min_score", 2))
    candidate_limit = int(config.get("candidate_limit", 500))
    translations = json.loads(TRANSLATIONS_JSON.read_text(encoding="utf-8")) if TRANSLATIONS_JSON.exists() else {}
    for item in items:
        item.update(structured_fields(item))
        translated = translations.get(canonical_url(item.get("url", "")), {})
        if translated:
            item.update(translated)
            item["translation_ready"] = True
    active_items = [
        item for item in cap_sources(items, config)
        if item["score"] >= min_score
        and int(item.get("taste_score", 0)) >= min_taste
        and is_public_radar_item(item)
        and is_display_ready(item)
    ][:candidate_limit]
    source_runs = [run for run in runs if run.get("id") != "codex-browser-ingest"]
    ingest_run = next((run for run in runs if run.get("id") == "codex-browser-ingest"), None)
    source_ok = sum(1 for run in source_runs if run["status"] == "ok")
    source_agent = sum(1 for run in source_runs if run["status"] == "agent")
    status = {
        "generated_at": iso_now(), "window_days": window_days, "candidate_min_score": min_score, "taste_min_score": min_taste,
        "candidate_count": len(active_items),
        "raw_count": len(items), "sources_total": len(source_runs), "sources_ok": source_ok,
        "sources_agent": source_agent, "sources_error": sum(1 for run in source_runs if run["status"] == "error"),
        "last_ingest": ingest_run,
        "runs": runs,
    }
    payload = {"status": status, "items": active_items}
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUTPUT_JS.write_text("window.SIGNAL_PIPELINE = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    STATUS_JSON.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--window-days", type=int, default=None)
    parser.add_argument("--source", action="append", help="Run only one or more source ids")
    parser.add_argument("--max-sources", type=int, default=0, help="Useful for smoke tests")
    parser.add_argument("--rebuild-only", action="store_true", help="Re-score and filter the existing pool without network access")
    args = parser.parse_args()
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    window_days = args.window_days or config.get("default_window_days", 45)
    if args.rebuild_only:
        current = json.loads(OUTPUT_JSON.read_text(encoding="utf-8")) if OUTPUT_JSON.exists() else {"items": [], "status": {}}
        source_by_id = {source["id"]: source for source in config["sources"] if source.get("enabled", True)}
        retention_cutoff = utc_now() - dt.timedelta(days=int(config.get("retention_days", 75)))
        items = []
        for item in current.get("items", []):
            source = source_by_id.get(item.get("source_id"))
            if not source or parse_date(item.get("published_at", "")) < retention_cutoff:
                continue
            if not is_relevant(f"{item.get('title', '')} {item.get('summary', '')}", source.get("topics", [])):
                continue
            if not meets_source_quality(item, source):
                continue
            item["source"] = source["name"]
            item["source_type"] = source["type"]
            item["tier"] = source.get("tier", "C")
            item["score"], item["score_reasons"] = score_item(item, source, utc_now())
            item["taste_score"], item["taste_reasons"] = taste_score(item)
            item["event_key"] = event_key(item)
            items.append(item)
        items = deduplicate(items)
        prior_runs = {run.get("id"): run for run in current.get("status", {}).get("runs", [])}
        runs = []
        for source in config["sources"]:
            if source.get("enabled", True) is False:
                continue
            if source["type"] == "agent":
                runs.append({"id": source["id"], "name": source["name"], "status": "agent", "count": 0, "note": source.get("note", "由定时任务检查")})
            else:
                runs.append(prior_runs.get(source["id"], {"id": source["id"], "name": source["name"], "status": "pending", "count": 0}))
        prior_ingest = prior_runs.get("codex-browser-ingest")
        if prior_ingest:
            runs.append(prior_ingest)
        write_outputs(items, runs, window_days)
        print(json.dumps({"candidates": len(items), "mode": "rebuild-only"}, ensure_ascii=False))
        return 0
    cutoff = utc_now() - dt.timedelta(days=window_days)
    since = cutoff.date().isoformat()
    sources = [source for source in config["sources"] if source.get("enabled", True) and (not args.source or source["id"] in set(args.source))]
    if args.max_sources: sources = sources[:args.max_sources]
    all_items, run_by_id = [], {}
    direct_sources = []
    for source in sources:
        if source["type"] == "agent":
            run_by_id[source["id"]] = {"id": source["id"], "name": source["name"], "status": "agent", "count": 0, "note": source.get("note", "由定时任务检查")}
        else:
            direct_sources.append(source)

    def collect_one(source: dict) -> tuple[list[dict], dict]:
        started = time.monotonic()
        try:
            collected = collect_source(source, since)
            collected = [item for item in collected if parse_date(item["published_at"]) >= cutoff]
            run = {"id": source["id"], "name": source["name"], "status": "ok", "count": len(collected), "ms": round((time.monotonic() - started) * 1000)}
            return collected, run
        except Exception as exc:
            run = {"id": source["id"], "name": source["name"], "status": "error", "count": 0, "error": f"{type(exc).__name__}: {str(exc)[:180]}"}
            return [], run

    max_workers = max(1, min(int(config.get("max_workers", 8)), len(direct_sources) or 1))
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(collect_one, source): source for source in direct_sources}
        for future in concurrent.futures.as_completed(futures):
            collected, run = future.result()
            all_items.extend(collected)
            run_by_id[run["id"]] = run
    runs = [run_by_id[source["id"]] for source in sources]
    # Preserve useful candidates between runs. Previously, every direct collection
    # overwrote browser/X/WeChat discoveries, which made the radar look artificially
    # sparse whenever network feeds failed.
    retention_days = int(config.get("retention_days", max(window_days, 60)))
    retention_cutoff = utc_now() - dt.timedelta(days=retention_days)
    existing_items = []
    if OUTPUT_JSON.exists():
        existing_payload = json.loads(OUTPUT_JSON.read_text(encoding="utf-8"))
        source_by_id = {source["id"]: source for source in config["sources"] if source.get("enabled", True)}
        existing_items = [
            item for item in existing_payload.get("items", [])
            if parse_date(item.get("published_at", "")) >= retention_cutoff
            and item.get("source_id") in source_by_id
            and is_relevant(
                f"{item.get('title', '')} {item.get('summary', '')}",
                source_by_id[item["source_id"]].get("topics", []),
            )
            and meets_source_quality(item, source_by_id[item["source_id"]])
        ]
        for item in existing_items:
            source = source_by_id.get(item.get("source_id"))
            if source:
                item["source"] = source["name"]
                item["source_type"] = source["type"]
                item["tier"] = source.get("tier", "C")
                item["score"], item["score_reasons"] = score_item(item, source, utc_now())
                item["taste_score"], item["taste_reasons"] = taste_score(item)
                item["event_key"] = event_key(item)
    items = deduplicate(existing_items + all_items)
    write_outputs(items, runs, window_days)
    min_score = int(config.get("candidate_min_score", 25))
    print(json.dumps({"candidates": len(items), "published_to_radar": sum(1 for item in items if item["score"] >= min_score), "sources": len(runs), "errors": sum(1 for run in runs if run["status"] == "error")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
