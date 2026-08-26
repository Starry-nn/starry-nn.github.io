#!/usr/bin/env python3
"""Import ignored local Skill ZIPs with a Supabase service-role key."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import inspect_skill_zip


def request(url, key, method="GET", body=None, headers=None):
    request_headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        **(headers or {}),
    }
    req = urllib.request.Request(url, data=body, method=method, headers=request_headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise RuntimeError("Supabase request failed (%s): %s" % (exc.code, detail)) from exc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--owner-id", required=True)
    parser.add_argument("--category", default="自动化与工具")
    parser.add_argument("bundle_dir", type=Path)
    args = parser.parse_args()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is required")

    packages = sorted(args.bundle_dir.glob("*.zip"))
    if not packages:
        raise SystemExit("No ZIP packages found")

    for package_path in packages:
        package = package_path.read_bytes()
        meta = inspect_skill_zip(package)
        object_path = "%s/%s.zip" % (args.owner_id, meta["slug"])
        storage_url = "%s/storage/v1/object/%s/%s" % (
            args.url.rstrip("/"),
            "private-skills",
            urllib.parse.quote(object_path, safe="/"),
        )
        request(
            storage_url,
            key,
            method="POST",
            body=package,
            headers={"Content-Type": "application/zip", "x-upsert": "true"},
        )
        record = {
            "owner_id": args.owner_id,
            "slug": meta["slug"],
            "name": meta["name"],
            "description": meta["description"],
            "category": args.category,
            "object_path": object_path,
            "package_sha256": meta["sha256"],
            "file_count": meta["file_count"],
        }
        rest_url = args.url.rstrip("/") + "/rest/v1/private_skills?on_conflict=owner_id,slug"
        request(
            rest_url,
            key,
            method="POST",
            body=json.dumps(record, ensure_ascii=False).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
        )
        print("Imported %s (%s files)" % (meta["slug"], meta["file_count"]))


if __name__ == "__main__":
    main()
