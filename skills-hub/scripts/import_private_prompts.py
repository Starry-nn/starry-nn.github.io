#!/usr/bin/env python3
"""Import a validated local Prompt library into one private Supabase account."""

import argparse
import json
import os
import urllib.parse
from pathlib import Path

from import_private_bundles import request


CATEGORY_BY_ID = {
    "event-summary": "行业研究",
    "financing-project-structuring": "商业尽调",
    "github-weekly-open-source": "项目发现",
    "interview-transcript-to-article": "内容交付",
    "investment-ops-sop": "基金运营",
    "person-mapping": "人才与关系",
    "personnel-change-research": "人才与关系",
    "product-hunt-kickstarter-chinese-projects": "项目发现",
    "product-tracking-database": "数据与表格",
    "talent-tracking-summary": "人才与关系",
    "technical-meeting-qa-minutes": "会议与知识",
    "topic-chinese-researchers": "人才与关系",
    "transaction-event-summary": "行业研究",
    "weekly-cross-platform-product-brief": "项目发现",
    "weekly-product-tracking-summary": "项目发现",
}


def parse_value(value):
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        return [] if not inner else [item.strip().strip("\"'") for item in inner.split(",")]
    if value.isdigit():
        return int(value)
    return value.strip("\"'")


def read_prompt(path):
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    if not text.startswith("---\n"):
        raise ValueError("missing frontmatter: %s" % path)
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError("missing closing frontmatter: %s" % path)
    metadata = {}
    for line in text[4:end].splitlines():
        if line.strip() and not line.lstrip().startswith("#") and ":" in line:
            key, value = line.split(":", 1)
            metadata[key.strip()] = parse_value(value)
    body = text[end + 4:].lstrip("\n")
    return metadata, body


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("library", type=Path)
    args = parser.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required")

    user_url = "%s/rest/v1/skill_users?username_norm=eq.%s&select=id" % (
        args.url.rstrip("/"), urllib.parse.quote(args.username.lower(), safe=""))
    users = json.loads(request(user_url, key))
    if len(users) != 1:
        raise SystemExit("Expected exactly one matching user")
    owner_id = users[0]["id"]

    records = []
    for path in sorted(args.library.glob("*.md")):
        metadata, body = read_prompt(path)
        prompt_id = metadata["id"]
        records.append({
            "owner_id": owner_id,
            "slug": prompt_id,
            "name": metadata["name"],
            "description": metadata["description"],
            "category": CATEGORY_BY_ID.get(prompt_id, "其他"),
            "body": body,
            "task_types": metadata.get("task_types", []),
            "triggers": metadata.get("triggers", []),
            "inputs": metadata.get("inputs", []),
            "outputs": metadata.get("outputs", []),
            "language": metadata.get("language", "zh"),
            "version": metadata.get("version", 1),
            "status": metadata.get("status", "active"),
            "source": "prompt-task-router-import",
        })

    rest_url = args.url.rstrip("/") + "/rest/v1/private_prompts?on_conflict=owner_id,slug"
    request(rest_url, key, method="POST", body=json.dumps(records, ensure_ascii=False).encode("utf-8"), headers={
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    })
    print("Imported %s Prompts for %s" % (len(records), args.username))


if __name__ == "__main__":
    main()
