#!/usr/bin/env python3
"""Maintenance server for SIGNAL.

Serves the static site and a small, fixed API for status inspection and the two
approved maintenance jobs. It deliberately does not expose arbitrary commands.
"""

import argparse
import base64
import datetime as dt
import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import traceback
from http.cookies import SimpleCookie
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
LOCAL_ADMIN_ENV = ROOT / "infra" / "admin.env"


def load_local_admin_env():
    """Load ignored local credentials without overriding explicit environment values."""
    if not LOCAL_ADMIN_ENV.exists():
        return
    for raw_line in LOCAL_ADMIN_ENV.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_local_admin_env()

STATE_ROOT = Path(os.environ.get("SIGNAL_STATE_DIR", str(ROOT))).expanduser()
if not STATE_ROOT.is_absolute():
    STATE_ROOT = ROOT / STATE_ROOT
DATA = STATE_ROOT / "data"
BUNDLED_CONFIG = ROOT / "config" / "sources.json"
CONFIG = STATE_ROOT / "config" / "sources.json"
JOB_FILE = DATA / "last-job.json"
PUBLISH_STATUS_FILE = DATA / "publish-status.json"
PUBLISH_SETTINGS_FILE = DATA / "publish-settings.json"
SOURCE_BACKUP_DIR = DATA / "source-backups"
SOURCE_AUDIT_FILE = DATA / "source-audit.jsonl"
MAX_JOB_SECONDS = 300
MAX_JSON_BODY = 64 * 1024
MAX_IMPORT_BODY = 1024 * 1024
SESSION_COOKIE = "signal_session"
SESSION_TTL_SECONDS = 12 * 60 * 60
PBKDF2_ITERATIONS = 240000
PUBLIC_FILES = ("index.html", "styles.css", "app.js", "assets/signal-network.png", "data/feed.js")
STATIC_EXACT_PATHS = {
    "/", "/index.html", "/styles.css", "/app.js",
    "/admin.html", "/admin.css", "/admin.js", "/data/feed.js",
}

JOBS = {
    "collect": [sys.executable, str(ROOT / "scripts" / "collect.py"), "--window-days", "10"],
    "wechat": [sys.executable, str(ROOT / "scripts" / "wechat_rss.py"), "status"],
    "ingest": [sys.executable, str(ROOT / "scripts" / "ingest.py")],
    "publish": [sys.executable, str(ROOT / "scripts" / "publish.py")],
}

job_lock = threading.Lock()
config_lock = threading.Lock()
auth_lock = threading.Lock()
login_failures = {}
job_state = {
    "name": None,
    "status": "idle",
    "started_at": None,
    "finished_at": None,
    "exit_code": None,
    "stdout": "",
    "stderr": "",
}

SOURCE_TYPES = {"rss", "html", "agent", "wechat_rss", "hn", "huggingface", "github", "github_cn", "arxiv"}
SOURCE_LIST_FIELDS = {
    "topics", "allow_domains", "accounts", "handles", "companies", "communities", "shows",
    "channels", "organizations",
}
SOURCE_INT_FIELDS = {
    "max_items", "min_likes", "min_downloads", "min_stars", "story_limit", "page_size", "pages",
    "organization_limit",
}


def initialize_state():
    """Create the writable runtime tree and seed its source registry once."""
    DATA.mkdir(parents=True, exist_ok=True)
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    if CONFIG != BUNDLED_CONFIG and not CONFIG.exists():
        shutil.copy2(BUNDLED_CONFIG, CONFIG)


def static_path_allowed(path):
    if path in STATIC_EXACT_PATHS:
        return True
    if not re.fullmatch(r"/assets/[A-Za-z0-9._/-]+", path):
        return False
    candidate = (ROOT / path.lstrip("/")).resolve()
    try:
        candidate.relative_to((ROOT / "assets").resolve())
    except ValueError:
        return False
    return candidate.is_file()


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path, fallback):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback


def write_json_atomic(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def admin_auth_configured():
    return all(os.environ.get(name, "") for name in (
        "SIGNAL_ADMIN_USERNAME", "SIGNAL_ADMIN_PASSWORD_SALT",
        "SIGNAL_ADMIN_PASSWORD_HASH", "SIGNAL_SESSION_SECRET",
    ))


def password_hash(password, salt_hex):
    try:
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return ""
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS).hex()


def verify_login(username, password):
    expected_user = os.environ.get("SIGNAL_ADMIN_USERNAME", "")
    expected_hash = os.environ.get("SIGNAL_ADMIN_PASSWORD_HASH", "")
    supplied_hash = password_hash(password, os.environ.get("SIGNAL_ADMIN_PASSWORD_SALT", ""))
    return bool(expected_user and expected_hash) and hmac.compare_digest(username, expected_user) and hmac.compare_digest(supplied_hash, expected_hash)


def b64url_encode(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def b64url_decode(value):
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def make_session_token(username, now=None):
    now = int(now if now is not None else time.time())
    payload = json.dumps({"sub": username, "iat": now, "exp": now + SESSION_TTL_SECONDS}, separators=(",", ":")).encode("utf-8")
    encoded = b64url_encode(payload)
    signature = hmac.new(os.environ.get("SIGNAL_SESSION_SECRET", "").encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    return encoded + "." + b64url_encode(signature)


def session_username(token, now=None):
    try:
        encoded, supplied_signature = token.split(".", 1)
        expected_signature = hmac.new(os.environ.get("SIGNAL_SESSION_SECRET", "").encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(b64url_decode(supplied_signature), expected_signature):
            return None
        payload = json.loads(b64url_decode(encoded).decode("utf-8"))
        now = int(now if now is not None else time.time())
        if payload.get("exp", 0) < now or payload.get("sub") != os.environ.get("SIGNAL_ADMIN_USERNAME", ""):
            return None
        return payload["sub"]
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError, KeyError):
        return None


def cookie_session(handler):
    cookie = SimpleCookie()
    try:
        cookie.load(handler.headers.get("Cookie", ""))
    except Exception:
        return None
    morsel = cookie.get(SESSION_COOKIE)
    return session_username(morsel.value) if morsel else None


def login_rate_limited(address, now=None):
    now = float(now if now is not None else time.time())
    with auth_lock:
        attempts = [stamp for stamp in login_failures.get(address, []) if now - stamp < 600]
        login_failures[address] = attempts
        return len(attempts) >= 6


def record_login_failure(address, now=None):
    with auth_lock:
        login_failures.setdefault(address, []).append(float(now if now is not None else time.time()))


def clear_login_failures(address):
    with auth_lock:
        login_failures.pop(address, None)


def normalize_source(payload, existing=None):
    if not isinstance(payload, dict):
        raise ValueError("source_must_be_object")
    source_id = str(payload.get("id") or (existing or {}).get("id") or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,63}", source_id):
        raise ValueError("invalid_source_id")
    if existing and source_id != existing.get("id"):
        raise ValueError("source_id_is_immutable")
    name = str(payload.get("name") or (existing or {}).get("name") or "").strip()
    source_type = str(payload.get("type") or (existing or {}).get("type") or "").strip()
    url = str(payload.get("url") or (existing or {}).get("url") or "").strip()
    tier = str(payload.get("tier") or (existing or {}).get("tier") or "B").upper()
    region = str(payload.get("region") or (existing or {}).get("region") or "global").lower()
    if not name or len(name) > 120:
        raise ValueError("invalid_source_name")
    if source_type not in SOURCE_TYPES:
        raise ValueError("unsupported_source_type")
    if urlsplit(url).scheme not in {"http", "https"} or not urlsplit(url).netloc:
        raise ValueError("invalid_source_url")
    if tier not in {"A", "B", "C"}:
        raise ValueError("invalid_source_tier")
    if region not in {"cn", "global"}:
        raise ValueError("invalid_source_region")
    result = dict(existing or {})
    result.update({"id": source_id, "name": name, "type": source_type, "url": url, "tier": tier, "region": region})
    result["enabled"] = payload.get("enabled", result.get("enabled", True)) is not False
    topics = payload.get("topics", result.get("topics", []))
    if not isinstance(topics, list):
        raise ValueError("topics_must_be_list")
    result["topics"] = sorted({str(value).strip().lower() for value in topics if str(value).strip()})
    note = str(payload.get("note", result.get("note", ""))).strip()
    if note:
        result["note"] = note[:600]
    else:
        result.pop("note", None)
    for field in SOURCE_LIST_FIELDS - {"topics"}:
        if field not in payload:
            continue
        values = payload[field]
        if not isinstance(values, list):
            raise ValueError(field + "_must_be_list")
        result[field] = [str(value).strip() for value in values if str(value).strip()]
    for field in SOURCE_INT_FIELDS:
        if field not in payload:
            continue
        value = int(payload[field] or 0)
        if value < 0 or value > 10000:
            raise ValueError("invalid_" + field)
        result[field] = value
    return result


def backup_sources_config(action):
    if not CONFIG.exists():
        return None
    SOURCE_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    target = SOURCE_BACKUP_DIR / (stamp + "-" + re.sub(r"[^a-z0-9-]", "-", action.lower())[:48] + ".json")
    shutil.copy2(CONFIG, target)
    backups = sorted(SOURCE_BACKUP_DIR.glob("*.json"), reverse=True)
    for old in backups[20:]:
        old.unlink(missing_ok=True)
    return target


def audit_source_change(action, source_id, detail=None):
    DATA.mkdir(parents=True, exist_ok=True)
    record = {"at": now_iso(), "action": action, "source_id": source_id, "detail": detail or {}}
    with SOURCE_AUDIT_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")


def source_reference_count(source_id):
    payload = read_json(DATA / "candidates.json", {"items": []})
    return sum(1 for item in payload.get("items", []) if item.get("source_id") == source_id)


def save_sources(config, action, source_id):
    backup_sources_config(action)
    config["updated_at"] = now_iso()
    write_json_atomic(CONFIG, config)
    audit_source_change(action, source_id)


def public_job_state():
    with job_lock:
        return dict(job_state)


def save_job_state():
    write_json_atomic(JOB_FILE, public_job_state())


def publish_settings():
    payload = read_json(PUBLISH_SETTINGS_FILE, {"auto_publish": False})
    return {"auto_publish": payload.get("auto_publish") is True}


def save_publish_settings(payload):
    settings = {"auto_publish": payload.get("auto_publish") is True}
    write_json_atomic(PUBLISH_SETTINGS_FILE, settings)
    return settings


def local_public_digest():
    digest = hashlib.sha256()
    for relative_path in PUBLIC_FILES:
        path = ROOT / relative_path
        if not path.is_file():
            return None
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def public_publish_state():
    published = read_json(PUBLISH_STATUS_FILE, {})
    local_digest = local_public_digest()
    return {
        "local_digest": local_digest,
        "published": published,
        "needs_publish": not published or published.get("local_digest") != local_digest,
        "settings": publish_settings(),
    }


def run_job(name, command):
    try:
        completed = subprocess.run(
            command,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=MAX_JOB_SECONDS,
            check=False,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
        stdout = completed.stdout
        stderr = completed.stderr
        return_code = completed.returncode
        auto_publish = name in {"collect", "ingest"} and publish_settings()["auto_publish"]
        if return_code == 0 and auto_publish:
            deployed = subprocess.run(
                JOBS["publish"], cwd=str(ROOT), capture_output=True, text=True,
                timeout=MAX_JOB_SECONDS, check=False, env={**os.environ, "PYTHONUNBUFFERED": "1"},
            )
            stdout += "\n\n[auto-publish]\n" + deployed.stdout
            stderr += "\n\n[auto-publish]\n" + deployed.stderr
            return_code = deployed.returncode
        with job_lock:
            job_state.update({
                "status": "succeeded" if return_code == 0 else "failed",
                "finished_at": now_iso(),
                "exit_code": return_code,
                "stdout": stdout[-12000:],
                "stderr": stderr[-12000:],
            })
    except subprocess.TimeoutExpired as exc:
        with job_lock:
            job_state.update({
                "status": "timed_out", "finished_at": now_iso(), "exit_code": None,
                "stdout": (exc.stdout or "")[-12000:] if isinstance(exc.stdout, str) else "",
                "stderr": "任务超过 %s 秒，已停止。" % MAX_JOB_SECONDS,
            })
    except Exception:
        with job_lock:
            job_state.update({
                "status": "failed", "finished_at": now_iso(), "exit_code": None,
                "stderr": traceback.format_exc()[-12000:],
            })
    save_job_state()


def start_job(name, command=None):
    command = command or JOBS.get(name)
    if not command:
        return False, {"status": "rejected", "name": name, "error": "unknown_job"}
    with job_lock:
        if job_state["status"] == "running":
            return False, dict(job_state)
        job_state.update({
            "name": name, "status": "running", "started_at": now_iso(),
            "finished_at": None, "exit_code": None, "stdout": "", "stderr": "",
        })
        snapshot = dict(job_state)
    save_job_state()
    threading.Thread(target=run_job, args=(name, command), daemon=True, name="signal-%s" % name).start()
    return True, snapshot


def authorized(handler):
    token = os.environ.get("SIGNAL_ADMIN_TOKEN", "")
    supplied = handler.headers.get("Authorization", "")
    if token and hmac.compare_digest(supplied, "Bearer " + token):
        return True
    if admin_auth_configured() and cookie_session(handler):
        return True
    if token or admin_auth_configured():
        return False
    return handler.client_address[0] in {"127.0.0.1", "::1"}


def authorized_action(handler):
    return authorized(handler) and hmac.compare_digest(
        handler.headers.get("X-Signal-Action", ""), "maintenance"
    )


class SignalHandler(SimpleHTTPRequestHandler):
    server_version = "SIGNAL/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        # This is a local maintenance server. Do not let the browser keep an
        # old feed.js/app.js after a collection job rewrites the static bundle.
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def json_response(self, payload, status=HTTPStatus.OK, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def json_body(self, maximum=MAX_JSON_BODY):
        try:
            length = int(self.headers.get("Content-Length", "0") or 0)
        except ValueError:
            raise ValueError("invalid_content_length")
        if length > maximum:
            raise OverflowError("request_too_large")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, ValueError):
            raise ValueError("invalid_json")

    def require_api_auth(self):
        if authorized(self):
            return True
        self.json_response({"ok": False, "error": "unauthorized"}, HTTPStatus.UNAUTHORIZED)
        return False

    def require_action_auth(self):
        if authorized_action(self):
            return True
        self.json_response({"ok": False, "error": "unauthorized"}, HTTPStatus.UNAUTHORIZED)
        return False

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/health":
            return self.json_response({"ok": True, "service": "SIGNAL", "time": now_iso(), "auth_required": bool(os.environ.get("SIGNAL_ADMIN_TOKEN") or admin_auth_configured())})
        if path == "/api/auth":
            username = cookie_session(self)
            token_authenticated = bool(os.environ.get("SIGNAL_ADMIN_TOKEN")) and authorized(self)
            return self.json_response({"ok": True, "configured": admin_auth_configured(), "authenticated": bool(username or token_authenticated), "username": username})
        if path.startswith("/api/") and not self.require_api_auth():
            return
        if path == "/api/status":
            status = read_json(DATA / "status.json", {})
            return self.json_response({"ok": True, "pipeline": status, "job": public_job_state()})
        if path == "/api/sources":
            config = read_json(CONFIG, {"sources": []})
            status = read_json(DATA / "status.json", {"runs": []})
            runs = {run.get("id"): run for run in status.get("runs", [])}
            sources = [{**source, "run": runs.get(source["id"], {"status": "unknown", "count": 0})} for source in config.get("sources", [])]
            return self.json_response({"ok": True, "count": len(sources), "sources": sources})
        if path == "/api/sources/export":
            config = read_json(CONFIG, {"sources": []})
            return self.json_response(config, headers={"Content-Disposition": "attachment; filename=signal-sources.json"})
        if path == "/api/candidates":
            payload = read_json(DATA / "candidates.json", {"status": {}, "items": []})
            return self.json_response({"ok": True, **payload})
        if path == "/api/job":
            return self.json_response({"ok": True, "job": public_job_state()})
        if path == "/api/publish":
            return self.json_response({"ok": True, **public_publish_state()})
        if path == "/admin":
            self.send_response(HTTPStatus.TEMPORARY_REDIRECT)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return
        if path == "/" and not (ROOT / "index.html").is_file():
            self.send_response(HTTPStatus.TEMPORARY_REDIRECT)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return
        if not static_path_allowed(path):
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_GET()

    def do_HEAD(self):
        path = urlsplit(self.path).path
        if path == "/admin":
            self.send_response(HTTPStatus.TEMPORARY_REDIRECT)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return
        if path == "/" and not (ROOT / "index.html").is_file():
            self.send_response(HTTPStatus.TEMPORARY_REDIRECT)
            self.send_header("Location", "/admin.html")
            self.end_headers()
            return
        if not static_path_allowed(path):
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_HEAD()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == "/api/login":
            address = self.client_address[0]
            if not admin_auth_configured():
                return self.json_response({"ok": False, "error": "password_login_not_configured"}, HTTPStatus.SERVICE_UNAVAILABLE)
            if login_rate_limited(address):
                return self.json_response({"ok": False, "error": "too_many_attempts"}, HTTPStatus.TOO_MANY_REQUESTS)
            try:
                payload = self.json_body(4096)
            except OverflowError:
                return self.json_response({"ok": False, "error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            except ValueError as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            username = str(payload.get("username", ""))
            if not verify_login(username, str(payload.get("password", ""))):
                record_login_failure(address)
                return self.json_response({"ok": False, "error": "invalid_credentials"}, HTTPStatus.UNAUTHORIZED)
            clear_login_failures(address)
            secure = self.headers.get("X-Forwarded-Proto", "").lower() == "https"
            cookie = "%s=%s; Path=/; Max-Age=%s; HttpOnly; SameSite=Strict%s" % (
                SESSION_COOKIE, make_session_token(username), SESSION_TTL_SECONDS, "; Secure" if secure else "",
            )
            return self.json_response({"ok": True, "username": username, "expires_in": SESSION_TTL_SECONDS}, headers={"Set-Cookie": cookie})
        if path == "/api/logout":
            return self.json_response({"ok": True}, headers={"Set-Cookie": "%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict" % SESSION_COOKIE})
        run_paths = {"/api/run/collect", "/api/run/wechat", "/api/run/ingest", "/api/run/publish"}
        if path not in run_paths | {"/api/publish/settings", "/api/sources", "/api/sources/import"} and not path.startswith("/api/run/source/"):
            return self.json_response({"ok": False, "error": "not_found"}, HTTPStatus.NOT_FOUND)
        if not self.require_action_auth():
            return
        try:
            payload = self.json_body(MAX_IMPORT_BODY if path == "/api/sources/import" else MAX_JSON_BODY)
        except OverflowError:
            return self.json_response({"ok": False, "error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        except ValueError as exc:
            return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
        if path == "/api/publish/settings":
            settings = save_publish_settings(payload)
            return self.json_response({"ok": True, "settings": settings})
        if path == "/api/sources/import":
            incoming = payload.get("sources") if isinstance(payload, dict) else None
            if not isinstance(incoming, list) or not incoming or len(incoming) > 500:
                return self.json_response({"ok": False, "error": "sources_must_be_nonempty_list_with_max_500"}, HTTPStatus.BAD_REQUEST)
            try:
                with config_lock:
                    config = read_json(CONFIG, {"sources": []})
                    existing_by_id = {item.get("id"): item for item in config.get("sources", [])}
                    normalized, seen = [], set()
                    for item in incoming:
                        item_id = str((item or {}).get("id", "")).strip().lower() if isinstance(item, dict) else ""
                        if item_id in seen:
                            raise ValueError("duplicate_source_id_in_import:" + item_id)
                        seen.add(item_id)
                        normalized.append(normalize_source(item, existing_by_id.get(item_id)))
                    created = sum(1 for item in normalized if item["id"] not in existing_by_id)
                    updated = len(normalized) - created
                    merged = {item.get("id"): item for item in config.get("sources", [])}
                    merged.update({item["id"]: item for item in normalized})
                    config["sources"] = list(merged.values())
                    save_sources(config, "bulk-import", "%s-sources" % len(normalized))
            except (ValueError, TypeError) as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return self.json_response({"ok": True, "imported": len(normalized), "created": created, "updated": updated, "total": len(config["sources"])})
        if path == "/api/sources":
            try:
                source = normalize_source(payload)
                with config_lock:
                    config = read_json(CONFIG, {"sources": []})
                    if any(item.get("id") == source["id"] for item in config.get("sources", [])):
                        return self.json_response({"ok": False, "error": "source_id_exists"}, HTTPStatus.CONFLICT)
                    config.setdefault("sources", []).append(source)
                    save_sources(config, "create", source["id"])
            except (ValueError, TypeError) as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return self.json_response({"ok": True, "source": source}, HTTPStatus.CREATED)
        if path.startswith("/api/run/source/"):
            source_id = path.rsplit("/", 1)[-1]
            config = read_json(CONFIG, {"sources": []})
            source = next((item for item in config.get("sources", []) if item.get("id") == source_id), None)
            if not source:
                return self.json_response({"ok": False, "error": "source_not_found"}, HTTPStatus.NOT_FOUND)
            if source.get("enabled", True) is False:
                return self.json_response({"ok": False, "error": "source_disabled"}, HTTPStatus.CONFLICT)
            command = [sys.executable, str(ROOT / "scripts" / "collect.py"), "--window-days", "10", "--source", source_id]
            started, state = start_job("source:" + source_id, command)
            return self.json_response({"ok": started, "job": state, "error": None if started else "job_already_running"}, HTTPStatus.ACCEPTED if started else HTTPStatus.CONFLICT)
        name = path.rsplit("/", 1)[-1]
        started, state = start_job(name)
        return self.json_response({"ok": started, "job": state, "error": None if started else "job_already_running"}, HTTPStatus.ACCEPTED if started else HTTPStatus.CONFLICT)

    def do_PUT(self):
        path = urlsplit(self.path).path
        if not path.startswith("/api/sources/"):
            return self.json_response({"ok": False, "error": "not_found"}, HTTPStatus.NOT_FOUND)
        if not self.require_action_auth():
            return
        source_id = path.rsplit("/", 1)[-1]
        try:
            payload = self.json_body()
            with config_lock:
                config = read_json(CONFIG, {"sources": []})
                index = next((i for i, item in enumerate(config.get("sources", [])) if item.get("id") == source_id), None)
                if index is None:
                    return self.json_response({"ok": False, "error": "source_not_found"}, HTTPStatus.NOT_FOUND)
                source = normalize_source({**payload, "id": source_id}, config["sources"][index])
                config["sources"][index] = source
                save_sources(config, "update", source_id)
        except OverflowError:
            return self.json_response({"ok": False, "error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        except (ValueError, TypeError) as exc:
            return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
        return self.json_response({"ok": True, "source": source})

    def do_DELETE(self):
        parsed = urlsplit(self.path)
        if not parsed.path.startswith("/api/sources/"):
            return self.json_response({"ok": False, "error": "not_found"}, HTTPStatus.NOT_FOUND)
        if not self.require_action_auth():
            return
        source_id = parsed.path.rsplit("/", 1)[-1]
        force = parse_qs(parsed.query).get("force", [""])[0].lower() == "true"
        references = source_reference_count(source_id)
        if references and not force:
            return self.json_response({"ok": False, "error": "source_has_candidates", "references": references}, HTTPStatus.CONFLICT)
        with config_lock:
            config = read_json(CONFIG, {"sources": []})
            previous_count = len(config.get("sources", []))
            config["sources"] = [item for item in config.get("sources", []) if item.get("id") != source_id]
            if len(config["sources"]) == previous_count:
                return self.json_response({"ok": False, "error": "source_not_found"}, HTTPStatus.NOT_FOUND)
            save_sources(config, "delete", source_id)
        return self.json_response({"ok": True, "deleted": source_id, "references": references})


def main():
    parser = argparse.ArgumentParser(description="Serve SIGNAL and its local maintenance API")
    try:
        default_port = int(os.environ.get("PORT", os.environ.get("SIGNAL_PORT", "8765")))
    except ValueError:
        default_port = 8765
    parser.add_argument("--host", default=os.environ.get("SIGNAL_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=default_port)
    args = parser.parse_args()
    if args.host not in {"127.0.0.1", "::1", "localhost"} and not (os.environ.get("SIGNAL_ADMIN_TOKEN") or admin_auth_configured()):
        parser.error("Password login or SIGNAL_ADMIN_TOKEN is required when binding beyond localhost")
    initialize_state()
    server = ThreadingHTTPServer((args.host, args.port), SignalHandler)
    print("SIGNAL maintenance server: http://%s:%s/" % (args.host, args.port), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
