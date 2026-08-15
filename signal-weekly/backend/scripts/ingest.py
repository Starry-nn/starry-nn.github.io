#!/usr/bin/env python3
"""Import candidates gathered by Codex browsing into SIGNAL's radar feed."""

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

import collect

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INBOX = ROOT / "data" / "inbox.json"


def load_sources():
    config = json.loads(collect.CONFIG_PATH.read_text(encoding="utf-8"))
    return config, {source["id"]: source for source in config["sources"]}


def normalize_entry(entry, sources):
    source_id = entry.get("source_id", "")
    source = sources.get(source_id)
    if not source:
        raise ValueError("unknown source_id: %s" % source_id)
    published = collect.parse_date(entry.get("published_at", ""))
    item = collect.base_item(
        source,
        entry.get("title", ""),
        entry.get("url", ""),
        entry.get("summary", ""),
        published,
        int(entry.get("engagement", 0) or 0),
    )
    if item is None:
        raise ValueError("entry is irrelevant, incomplete, or has an unsafe URL")
    if entry.get("region") in {"cn", "global"}:
        item["region"] = entry["region"]
    if entry.get("topics"):
        item["topics"] = sorted(set(item["topics"]) | set(entry["topics"]))
    if entry.get("author"):
        item["author"] = collect.clean_text(entry["author"])
    if entry.get("kind"):
        item["kind"] = collect.clean_text(entry["kind"])
    for field in ("title_zh", "summary_zh", "original_title", "primary_source", "evidence_note", "translation_ready", "company", "project"):
        if field in entry:
            item[field] = entry[field] if field == "translation_ready" else collect.clean_text(str(entry[field]))
    if entry.get("corroborating_sources"):
        item["corroborating_sources"] = entry["corroborating_sources"]
    item["language"] = entry.get("language", item.get("language", "zh"))
    item["taste_score"], item["taste_reasons"] = collect.taste_score(item)
    item["event_key"] = collect.event_key(item)
    return item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INBOX))
    parser.add_argument("--replace", action="store_true", help="Do not merge the existing radar")
    args = parser.parse_args()
    inbox_path = Path(args.input)
    payload = json.loads(inbox_path.read_text(encoding="utf-8"))
    entries = payload.get("items", payload if isinstance(payload, list) else [])
    config, sources = load_sources()
    accepted, rejected = [], []
    for index, entry in enumerate(entries):
        try:
            accepted.append(normalize_entry(entry, sources))
        except Exception as exc:
            rejected.append({"index": index, "title": entry.get("title", ""), "error": str(exc)})
    existing = []
    prior_runs = []
    if not args.replace and collect.OUTPUT_JSON.exists():
        current = json.loads(collect.OUTPUT_JSON.read_text(encoding="utf-8"))
        existing = current.get("items", [])
        prior_runs = current.get("status", {}).get("runs", [])
    # Freshly verified browser/editor entries intentionally override a cached
    # candidate with the same URL or event key.
    items = collect.deduplicate(accepted + existing)
    agent_run = {
        "id": "codex-browser-ingest", "name": "Codex 浏览器采集",
        "status": "ok", "count": len(accepted), "rejected": len(rejected),
        "at": collect.iso_now(),
    }
    valid_source_ids = set(sources)
    runs_by_id = {
        run.get("id"): run for run in prior_runs
        if run.get("id") != agent_run["id"] and run.get("id") in valid_source_ids
    }
    for source in config["sources"]:
        if source["id"] not in runs_by_id:
            if source["type"] == "agent":
                runs_by_id[source["id"]] = {"id": source["id"], "name": source["name"], "status": "agent", "count": 0, "note": source.get("note", "由定时任务检查")}
            else:
                runs_by_id[source["id"]] = {"id": source["id"], "name": source["name"], "status": "pending", "count": 0}
    runs = list(runs_by_id.values()) + [agent_run]
    collect.write_outputs(items, runs, config.get("default_window_days", 10))
    report = {"accepted": len(accepted), "rejected": rejected, "radar_total": len(items)}
    print(json.dumps(report, ensure_ascii=False))
    return 0 if not rejected else 2


if __name__ == "__main__":
    sys.exit(main())
