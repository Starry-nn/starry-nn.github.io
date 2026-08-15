#!/usr/bin/env python3
"""Inspect or synchronize SIGNAL's WeChat watchlist with a private WeRSS instance."""

from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE_ROOT = Path(os.environ.get("SIGNAL_STATE_DIR", str(ROOT))).expanduser()
if not STATE_ROOT.is_absolute():
    STATE_ROOT = ROOT / STATE_ROOT
CONFIG = STATE_ROOT / "config" / "sources.json"
LOCAL_ENV = ROOT / "infra" / "wechat-rss" / ".env"
USER_AGENT = "SIGNAL-WeChat-RSS/1.0 (+local maintenance)"
API_PREFIX = "/api/v1/wx"


def load_local_env() -> None:
    """Load ignored local credentials when the caller did not export them."""
    if not LOCAL_ENV.exists():
        return
    for raw_line in LOCAL_ENV.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_local_env()


def source_config() -> dict:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    return next(source for source in config["sources"] if source["id"] == "wechat-rss")


def normalize(value: str) -> str:
    compact = "".join(character for character in str(value or "").strip().lower() if character not in " \t\r\n·•_-—/")
    return {
        "雷锋网": "雷峰网",
        "智猿ai": "智猩猩ai",
        "aing硬选": "aing硬迹",
        "ai智伴": "ai智件",
    }.get(compact, compact)


def settings() -> tuple[str, str]:
    source = source_config()
    base_url = os.environ.get("SIGNAL_WECHAT_RSS_URL", "").strip() or source["url"]
    access_key = os.environ.get("SIGNAL_WECHAT_RSS_ACCESS_KEY", "").strip()
    secret_key = os.environ.get("SIGNAL_WECHAT_RSS_SECRET_KEY", "").strip()
    if not access_key or not secret_key:
        raise RuntimeError("set SIGNAL_WECHAT_RSS_ACCESS_KEY and SIGNAL_WECHAT_RSS_SECRET_KEY first")
    return base_url.rstrip("/"), f"AK-SK {access_key}:{secret_key}"


def request_json(path: str, method: str = "GET", payload: dict | None = None):
    base_url, authorization = settings()
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        base_url + path,
        data=data,
        method=method,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json", "Content-Type": "application/json", "Authorization": authorization},
    )
    # macOS may expose a local HTTP proxy to Python even when the shell does
    # not show proxy variables. Keep the private loopback service direct.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def records(payload) -> list[dict]:
    if isinstance(payload, list):
        return [value for value in payload if isinstance(value, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("items", "list", "data", "results"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = records(value)
            if nested:
                return nested
    return []


def account_name(record: dict) -> str:
    return str(record.get("mp_name") or record.get("公众号名称") or record.get("nickname") or record.get("name") or record.get("channel_name") or record.get("title") or "").strip()


def list_subscriptions() -> list[dict]:
    return records(request_json(f"{API_PREFIX}/mps?limit=100&offset=0&kw="))


def add_payload(candidate: dict) -> dict:
    return {
        "mp_name": account_name(candidate),
        "mp_id": candidate.get("mp_id") or candidate.get("fakeid") or candidate.get("id"),
        "mp_cover": candidate.get("mp_cover") or candidate.get("cover") or candidate.get("round_head_img") or candidate.get("avatar") or "",
        "avatar": candidate.get("avatar") or candidate.get("round_head_img") or candidate.get("mp_cover") or "",
        "mp_intro": candidate.get("mp_intro") or candidate.get("signature") or candidate.get("intro") or "",
    }


def csv_candidates(path: str | Path) -> dict[str, list[dict]]:
    """Read a WeRSS export, keyed by normalized public-account name."""
    csv_path = Path(path).expanduser()
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    result: dict[str, list[dict]] = {}
    for row in rows:
        name = account_name(row)
        if not name:
            continue
        # WeRSS's add endpoint expects faker_id (base64), not MP_WXS_*.
        source_id = str(row.get("faker_id") or row.get("mp_id") or row.get("fakeid") or row.get("id") or "").strip()
        if source_id.startswith("MP_WXS_"):
            source_id = base64.b64encode(source_id.removeprefix("MP_WXS_").encode("utf-8")).decode("ascii")
        candidate = {
            "mp_name": name,
            "mp_id": source_id,
            "feed_id": row.get("id") or (f"MP_WXS_{source_id}" if source_id else ""),
            "mp_cover": row.get("封面图") or row.get("mp_cover") or row.get("cover") or "",
            "mp_intro": row.get("简介") or row.get("mp_intro") or row.get("intro") or "",
        }
        result.setdefault(normalize(name), []).append(candidate)
    return result


def sync(apply: bool, csv_path: str | None = None) -> dict:
    wanted = source_config()["accounts"]
    imported = csv_candidates(csv_path) if csv_path else {}
    existing = list_subscriptions()
    existing_names = {normalize(account_name(record)) for record in existing}
    existing_ids = {str(record.get("id") or "") for record in existing}
    if imported:
        missing = []
        for name in wanted:
            pool = imported.get(normalize(name), [])
            exact = [candidate for candidate in pool if account_name(candidate) == name]
            candidates = exact or pool
            if not candidates or not any(str(candidate.get("feed_id") or "") not in existing_ids for candidate in candidates):
                if not candidates:
                    missing.append(name)
            elif candidates:
                missing.append(name)
    else:
        missing = [name for name in wanted if normalize(name) not in existing_names]
    report = {"configured": len(wanted), "subscribed": len(existing), "unique_subscribed_names": len(existing_names), "missing": missing, "added": [], "unresolved": []}
    if not apply:
        return report
    if imported:
        report["imported_csv"] = str(Path(csv_path).expanduser())
    use_search = os.environ.get("SIGNAL_WECHAT_RSS_MODE", "weread_mp").strip().lower() != "weread_mp"
    for name in missing:
        pool = imported.get(normalize(name), [])
        exact = [value for value in pool if account_name(value) == name]
        candidate = next((value for value in (exact or pool) if str(value.get("feed_id") or "") not in existing_ids), None)
        if candidate is None and use_search:
            query = urllib.parse.quote(name, safe="")
            candidates = records(request_json(f"{API_PREFIX}/mps/search/{query}?limit=10"))
            candidate = next((value for value in candidates if normalize(account_name(value)) == normalize(name)), None)
        if not candidate:
            report["unresolved"].append(name)
            continue
        payload = add_payload(candidate)
        if not payload["mp_id"]:
            report["unresolved"].append(name)
            continue
        try:
            request_json(f"{API_PREFIX}/mps", method="POST", payload=payload)
            report["added"].append(name)
            if candidate.get("feed_id"):
                existing_ids.add(str(candidate["feed_id"]))
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError) as exc:
            report.setdefault("errors", []).append({"name": name, "error": f"{type(exc).__name__}: {exc}"})
    if not imported and not use_search:
        report["manual_required"] = missing
        report["note"] = "WeRead 模式需要提供 WeRSS 导出的 CSV（包含 MP_WXS_* 与 faker_id）后批量导入；不调用公众平台搜索接口。"
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Maintain SIGNAL's self-hosted WeChat RSS subscriptions")
    parser.add_argument("command", choices=("status", "sync"), nargs="?", default="status")
    parser.add_argument("--apply", action="store_true", help="Actually add exact-name matches; sync is dry-run without this flag")
    parser.add_argument("--csv", dest="csv_path", help="WeRSS CSV export containing id, 公众号名称 and faker_id")
    args = parser.parse_args()
    try:
        report = sync(apply=args.command == "sync" and args.apply, csv_path=args.csv_path)
    except (RuntimeError, urllib.error.URLError, urllib.error.HTTPError, ValueError) as exc:
        print(json.dumps({"ok": False, "error": f"{type(exc).__name__}: {exc}"}, ensure_ascii=False))
        return 1
    report["ok"] = True
    report["mode"] = "apply" if args.command == "sync" and args.apply else "status"
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
