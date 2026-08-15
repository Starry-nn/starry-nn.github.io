#!/usr/bin/env python3
"""Publish SIGNAL's approved static bundle to GitHub Pages.

Only the files in PUBLIC_FILES can leave the local workspace. The publisher
uses GitHub's Git Database API through an authenticated `gh` CLI session so it
works even when direct git transport is unavailable.
"""

import argparse
import base64
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
STATUS_FILE = DATA / "publish-status.json"
DEFAULT_REPO = "Starry-nn/starry-nn.github.io"
DEFAULT_BRANCH = "main"
DEFAULT_PREFIX = "signal-weekly"
PUBLIC_FILES = (
    "index.html",
    "styles.css",
    "app.js",
    "assets/signal-network.png",
    "data/feed.js",
)
MAX_PUBLIC_BYTES = 25 * 1024 * 1024


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_status(payload):
    STATUS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def public_digest(root=ROOT):
    digest = hashlib.sha256()
    for relative_path in PUBLIC_FILES:
        path = Path(root) / relative_path
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_public_files(root=ROOT):
    root = Path(root)
    missing = [name for name in PUBLIC_FILES if not (root / name).is_file()]
    if missing:
        raise ValueError("缺少公开文件：" + ", ".join(missing))
    total_bytes = sum((root / name).stat().st_size for name in PUBLIC_FILES)
    if total_bytes > MAX_PUBLIC_BYTES:
        raise ValueError("公开文件总大小超过 25 MB 安全限制")
    html = (root / "index.html").read_text(encoding="utf-8")
    if 'src="data/feed.js' not in html or 'src="app.js' not in html or 'href="styles.css' not in html:
        raise ValueError("index.html 未引用预期的相对静态资源")
    feed = (root / "data" / "feed.js").read_text(encoding="utf-8")
    if not feed.startswith("window.SIGNAL_PIPELINE = ") or not feed.rstrip().endswith(";"):
        raise ValueError("data/feed.js 格式无效")
    return total_bytes


def gh_api(method, endpoint, payload=None):
    command = ["gh", "api", "--method", method, endpoint]
    encoded = None
    if payload is not None:
        command.extend(["--input", "-"])
        encoded = json.dumps(payload)
    completed = subprocess.run(
        command,
        input=encoded,
        text=True,
        capture_output=True,
        check=False,
        timeout=90,
    )
    if completed.returncode:
        detail = (completed.stderr or completed.stdout or "GitHub API 请求失败").strip()
        raise RuntimeError(detail[-1200:])
    return json.loads(completed.stdout)


def build_tree_entries(repo, prefix, root=ROOT, api=gh_api):
    entries = []
    for relative_path in PUBLIC_FILES:
        content = base64.b64encode((Path(root) / relative_path).read_bytes()).decode("ascii")
        blob = api("POST", f"repos/{repo}/git/blobs", {"content": content, "encoding": "base64"})
        entries.append({
            "path": f"{prefix.strip('/')}/{relative_path}",
            "mode": "100644",
            "type": "blob",
            "sha": blob["sha"],
        })
    return entries


def publish(repo, branch, prefix, root=ROOT, api=gh_api):
    total_bytes = validate_public_files(root)
    digest = public_digest(root)
    ref = api("GET", f"repos/{repo}/git/ref/heads/{branch}")
    parent_sha = ref["object"]["sha"]
    parent = api("GET", f"repos/{repo}/git/commits/{parent_sha}")
    entries = build_tree_entries(repo, prefix, root, api)
    tree = api("POST", f"repos/{repo}/git/trees", {"base_tree": parent["tree"]["sha"], "tree": entries})

    if tree["sha"] == parent["tree"]["sha"]:
        commit_sha = parent_sha
        outcome = "already_current"
    else:
        commit = api("POST", f"repos/{repo}/git/commits", {
            "message": "Update Signal Weekly public feed",
            "tree": tree["sha"],
            "parents": [parent_sha],
        })
        commit_sha = commit["sha"]
        api("PATCH", f"repos/{repo}/git/refs/heads/{branch}", {"sha": commit_sha, "force": False})
        outcome = "published"

    pages = api("GET", f"repos/{repo}/pages")
    site_root = pages.get("html_url", "https://starry-nn.github.io/").rstrip("/")
    result = {
        "status": outcome,
        "published_at": now_iso(),
        "repo": repo,
        "branch": branch,
        "prefix": prefix.strip("/"),
        "commit": commit_sha,
        "local_digest": digest,
        "bytes": total_bytes,
        "pages_status": pages.get("status", "unknown"),
        "url": f"{site_root}/{prefix.strip('/')}/",
        "error": None,
    }
    write_status(result)
    return result


def main():
    parser = argparse.ArgumentParser(description="Publish SIGNAL's static bundle to GitHub Pages")
    parser.add_argument("--repo", default=os.environ.get("SIGNAL_GITHUB_REPO", DEFAULT_REPO))
    parser.add_argument("--branch", default=os.environ.get("SIGNAL_GITHUB_BRANCH", DEFAULT_BRANCH))
    parser.add_argument("--prefix", default=os.environ.get("SIGNAL_GITHUB_PREFIX", DEFAULT_PREFIX))
    parser.add_argument("--check", action="store_true", help="Validate the bundle without publishing")
    args = parser.parse_args()
    if args.check:
        print(json.dumps({"ok": True, "bytes": validate_public_files(), "digest": public_digest()}, ensure_ascii=False))
        return 0
    try:
        result = publish(args.repo, args.branch, args.prefix)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        failure = {
            "status": "failed",
            "published_at": now_iso(),
            "repo": args.repo,
            "branch": args.branch,
            "prefix": args.prefix.strip("/"),
            "error": str(exc)[-1200:],
        }
        write_status(failure)
        print(json.dumps(failure, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
