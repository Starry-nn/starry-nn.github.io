#!/usr/bin/env python3
"""Authenticated multi-user backend for Nan's Skills Desk.

The public catalog is readable without an account. Private skill packages,
bundles, and access tokens are isolated by user and never served as static
files.
"""

import argparse
import base64
import binascii
import datetime as dt
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import uuid
import zipfile
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
STATE_ROOT = Path(os.environ.get("SKILLS_STATE_DIR", str(ROOT / ".local-state"))).expanduser()
if not STATE_ROOT.is_absolute():
    STATE_ROOT = ROOT / STATE_ROOT
DB_PATH = STATE_ROOT / "skills-desk.sqlite3"
CATALOG_PATH = ROOT / "catalog.json"

SESSION_COOKIE = "skills_desk_session"
SESSION_TTL = 12 * 60 * 60
PBKDF2_ITERATIONS = 310_000
MAX_JSON_BODY = 9 * 1024 * 1024
MAX_ZIP_BYTES = 6 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 16 * 1024 * 1024
MAX_FILES_PER_SKILL = 160
MAX_SKILLS_PER_BUNDLE = 120

STATIC_FILES = {
    "/", "/index.html", "/styles.css", "/app.js", "/catalog.json", "/favicon.svg", "/supabase-config.js",
}
SKILL_CATEGORIES = {
    "项目发现", "BP 初筛", "行业研究", "商业尽调", "财务分析", "法务合规",
    "IC 材料", "投后管理", "募资与 LP", "基金运营", "人才与关系", "会议与知识",
    "数据与表格", "内容交付", "自动化与工具", "其他",
}

db_lock = threading.Lock()
auth_lock = threading.Lock()
auth_failures = {}


def now_iso():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def json_bytes(payload):
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def b64url_encode(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def b64url_decode(value):
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def password_digest(password, salt_hex):
    try:
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return ""
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS).hex()


def new_password_record(password):
    salt = secrets.token_bytes(16).hex()
    return salt, password_digest(password, salt)


def session_secret():
    value = os.environ.get("SKILLS_SESSION_SECRET", "")
    if len(value) < 32:
        raise RuntimeError("SKILLS_SESSION_SECRET must contain at least 32 characters")
    return value.encode("utf-8")


def make_session(user):
    payload = {
        "uid": user["id"],
        "sub": user["username"],
        "role": user["role"],
        "csrf": secrets.token_urlsafe(18),
        "iat": int(time.time()),
        "exp": int(time.time()) + SESSION_TTL,
    }
    encoded = b64url_encode(json_bytes(payload))
    signature = hmac.new(session_secret(), encoded.encode("ascii"), hashlib.sha256).digest()
    return encoded + "." + b64url_encode(signature), payload


def parse_session(token):
    try:
        encoded, supplied = token.split(".", 1)
        expected = hmac.new(session_secret(), encoded.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(b64url_decode(supplied), expected):
            return None
        payload = json.loads(b64url_decode(encoded).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError, TypeError):
        return None


def initialize_database():
    STATE_ROOT.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA journal_mode=WAL")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                username_norm TEXT NOT NULL UNIQUE,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                force_password_change INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS skills (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                slug TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'user-upload',
                package BLOB NOT NULL,
                package_sha256 TEXT NOT NULL,
                file_count INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(owner_id, slug)
            );
            CREATE TABLE IF NOT EXISTS access_tokens (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                label TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                last_used_at TEXT,
                revoked_at TEXT
            );
            """
        )
        connection.commit()
    seed_admin()


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def seed_admin():
    username = os.environ.get("SKILLS_ADMIN_USERNAME", "").strip()
    salt = os.environ.get("SKILLS_ADMIN_PASSWORD_SALT", "").strip()
    digest = os.environ.get("SKILLS_ADMIN_PASSWORD_HASH", "").strip()
    if not (username and salt and digest):
        return
    with db_lock, connect_db() as connection:
        existing = connection.execute("SELECT id FROM users WHERE username_norm = ?", (username.casefold(),)).fetchone()
        if existing:
            return
        connection.execute(
            "INSERT INTO users (id, username, username_norm, password_salt, password_hash, role, force_password_change, created_at) VALUES (?, ?, ?, ?, ?, 'admin', 1, ?)",
            (str(uuid.uuid4()), username, username.casefold(), salt, digest, now_iso()),
        )
        connection.commit()


def public_user(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "role": row["role"],
        "force_password_change": bool(row["force_password_change"]),
        "created_at": row["created_at"],
    }


def validate_username(username):
    value = str(username or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{2,31}", value):
        raise ValueError("用户名需为 3-32 位字母、数字、点、下划线或短横线")
    return value


def validate_password(password, initial_admin=False):
    value = str(password or "")
    minimum = 8 if initial_admin else 10
    if len(value) < minimum or len(value) > 128:
        raise ValueError("密码长度需为 %s-128 位" % minimum)
    if not re.search(r"[A-Za-z]", value) or not re.search(r"[^A-Za-z]", value):
        if not initial_admin:
            raise ValueError("密码需同时包含字母和数字或符号")
    return value


def rate_limited(address):
    now = time.time()
    with auth_lock:
        attempts = [stamp for stamp in auth_failures.get(address, []) if now - stamp < 600]
        auth_failures[address] = attempts
        return len(attempts) >= 8


def record_auth_failure(address):
    with auth_lock:
        auth_failures.setdefault(address, []).append(time.time())


def clear_auth_failures(address):
    with auth_lock:
        auth_failures.pop(address, None)


def token_hash(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def frontmatter_value(markdown, key):
    if not markdown.startswith("---"):
        return ""
    end = markdown.find("\n---", 3)
    if end == -1:
        return ""
    block = markdown[3:end]
    match = re.search(r"^%s:\s*[\"']?(.*?)[\"']?\s*$" % re.escape(key), block, re.MULTILINE)
    return match.group(1).strip() if match else ""


def safe_zip_member(name):
    path = PurePosixPath(name)
    return bool(name and not path.is_absolute() and ".." not in path.parts and "\\" not in name)


def inspect_skill_zip(package_bytes):
    if not package_bytes or len(package_bytes) > MAX_ZIP_BYTES:
        raise ValueError("Skill 压缩包需小于 6 MB")
    try:
        archive = zipfile.ZipFile(io.BytesIO(package_bytes))
    except zipfile.BadZipFile as exc:
        raise ValueError("文件不是有效的 ZIP 压缩包") from exc
    infos = [info for info in archive.infolist() if not info.is_dir() and not info.filename.startswith("__MACOSX/")]
    if not infos or len(infos) > MAX_FILES_PER_SKILL:
        raise ValueError("Skill 文件数量需为 1-160 个")
    if sum(info.file_size for info in infos) > MAX_UNCOMPRESSED_BYTES:
        raise ValueError("Skill 解压后需小于 16 MB")
    for info in infos:
        if not safe_zip_member(info.filename):
            raise ValueError("压缩包包含不安全的文件路径")
        unix_mode = (info.external_attr >> 16) & 0o170000
        if unix_mode == 0o120000:
            raise ValueError("压缩包不能包含符号链接")
    skill_files = [info for info in infos if PurePosixPath(info.filename).name == "SKILL.md"]
    if len(skill_files) != 1:
        raise ValueError("每个压缩包必须且只能包含一个 SKILL.md")
    skill_path = PurePosixPath(skill_files[0].filename)
    root_parts = skill_path.parts[:-1]
    if len(root_parts) != 1:
        raise ValueError("SKILL.md 必须位于单一 Skill 根目录中")
    root = root_parts[0]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,63}", root):
        raise ValueError("Skill 根目录名需使用小写字母、数字和短横线")
    if any(PurePosixPath(info.filename).parts[0] != root for info in infos):
        raise ValueError("压缩包中只能包含一个 Skill 根目录")
    try:
        markdown = archive.read(skill_files[0]).decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("SKILL.md 必须使用 UTF-8 编码") from exc
    name = frontmatter_value(markdown, "name")
    description = frontmatter_value(markdown, "description")
    if not name or not description:
        raise ValueError("SKILL.md frontmatter 必须包含 name 和 description")
    if name != root:
        raise ValueError("SKILL.md 的 name 必须与 Skill 根目录名一致")
    return {
        "slug": root,
        "name": name,
        "description": description[:600],
        "file_count": len(infos),
        "sha256": hashlib.sha256(package_bytes).hexdigest(),
    }


def bundle_for_user(owner_id):
    with connect_db() as connection:
        rows = connection.execute("SELECT slug, package FROM skills WHERE owner_id = ? ORDER BY slug", (owner_id,)).fetchall()
    if not rows:
        raise ValueError("你的私人仓库中还没有 Skill")
    if len(rows) > MAX_SKILLS_PER_BUNDLE:
        raise ValueError("单次打包最多支持 120 个 Skills")
    output = io.BytesIO()
    seen = set()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as target:
        for row in rows:
            with zipfile.ZipFile(io.BytesIO(row["package"])) as source:
                for info in source.infolist():
                    if info.is_dir() or info.filename.startswith("__MACOSX/"):
                        continue
                    if info.filename in seen:
                        raise ValueError("多个 Skill 包含重复路径")
                    seen.add(info.filename)
                    target.writestr(info, source.read(info.filename))
    return output.getvalue(), len(rows)


class SkillsHandler(SimpleHTTPRequestHandler):
    server_version = "SkillsDesk/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format_string, *args):
        print("%s - %s" % (self.address_string(), format_string % args), flush=True)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        super().end_headers()

    def json_response(self, payload, status=HTTPStatus.OK, headers=None):
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def binary_response(self, body, filename):
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", 'attachment; filename="%s"' % filename)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def json_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ValueError("invalid_content_length") from exc
        if length <= 0 or length > MAX_JSON_BODY:
            raise OverflowError("request_size")
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("invalid_json") from exc
        if not isinstance(payload, dict):
            raise ValueError("json_object_required")
        return payload

    def session_payload(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        morsel = cookie.get(SESSION_COOKIE)
        return parse_session(morsel.value) if morsel else None

    def bearer_user(self):
        authorization = self.headers.get("Authorization", "")
        if not authorization.startswith("Bearer sd_"):
            return None
        raw_token = authorization[7:].strip()
        digest = token_hash(raw_token)
        with db_lock, connect_db() as connection:
            row = connection.execute(
                "SELECT u.* , t.id AS token_id FROM access_tokens t JOIN users u ON u.id = t.owner_id WHERE t.token_hash = ? AND t.revoked_at IS NULL",
                (digest,),
            ).fetchone()
            if not row:
                return None
            connection.execute("UPDATE access_tokens SET last_used_at = ? WHERE id = ?", (now_iso(), row["token_id"]))
            connection.commit()
            return public_user(row)

    def authenticated_user(self):
        session = self.session_payload()
        if session:
            with connect_db() as connection:
                row = connection.execute("SELECT * FROM users WHERE id = ?", (session.get("uid"),)).fetchone()
            if row:
                return public_user(row), session, "session"
        bearer = self.bearer_user()
        return (bearer, None, "token") if bearer else (None, None, None)

    def require_auth(self, mutation=False):
        user, session, mode = self.authenticated_user()
        if not user:
            self.json_response({"ok": False, "error": "unauthorized"}, HTTPStatus.UNAUTHORIZED)
            return None
        if mutation and mode == "session":
            supplied = self.headers.get("X-CSRF-Token", "")
            if not supplied or not hmac.compare_digest(supplied, str(session.get("csrf", ""))):
                self.json_response({"ok": False, "error": "invalid_csrf"}, HTTPStatus.FORBIDDEN)
                return None
        if mutation and user["force_password_change"] and urlsplit(self.path).path != "/api/password":
            self.json_response({"ok": False, "error": "password_change_required"}, HTTPStatus.FORBIDDEN)
            return None
        return user

    def cookie_header(self, token, max_age=SESSION_TTL):
        secure = self.headers.get("X-Forwarded-Proto", "").lower() == "https"
        return "%s=%s; Path=/; Max-Age=%s; HttpOnly; SameSite=Lax%s" % (
            SESSION_COOKIE, token, max_age, "; Secure" if secure else "",
        )

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/health":
            return self.json_response({"ok": True, "service": "skills-desk", "time": now_iso()})
        if path == "/api/auth":
            user, session, mode = self.authenticated_user()
            return self.json_response({"ok": True, "authenticated": bool(user), "user": user, "csrf": session.get("csrf") if session else None, "mode": mode})
        if path == "/api/public-skills":
            try:
                catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                catalog = {"skills": []}
            return self.json_response({"ok": True, **catalog})
        if path == "/api/skills":
            user = self.require_auth()
            if not user:
                return
            with connect_db() as connection:
                rows = connection.execute(
                    "SELECT id, slug, name, description, category, source, package_sha256, file_count, created_at, updated_at FROM skills WHERE owner_id = ? ORDER BY updated_at DESC",
                    (user["id"],),
                ).fetchall()
            return self.json_response({"ok": True, "skills": [dict(row) for row in rows]})
        if path == "/api/tokens":
            user = self.require_auth()
            if not user:
                return
            with connect_db() as connection:
                rows = connection.execute(
                    "SELECT id, label, created_at, last_used_at, revoked_at FROM access_tokens WHERE owner_id = ? ORDER BY created_at DESC",
                    (user["id"],),
                ).fetchall()
            return self.json_response({"ok": True, "tokens": [dict(row) for row in rows]})
        if path == "/api/bundle":
            user = self.require_auth()
            if not user:
                return
            try:
                bundle, count = bundle_for_user(user["id"])
            except ValueError as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.CONFLICT)
            return self.binary_response(bundle, "%s-skills-%s.zip" % (user["username"], count))
        match = re.fullmatch(r"/api/skills/([a-f0-9-]+)/content", path)
        if match:
            user = self.require_auth()
            if not user:
                return
            with connect_db() as connection:
                row = connection.execute("SELECT slug, package FROM skills WHERE id = ? AND owner_id = ?", (match.group(1), user["id"])).fetchone()
            if not row:
                return self.json_response({"ok": False, "error": "skill_not_found"}, HTTPStatus.NOT_FOUND)
            return self.binary_response(row["package"], row["slug"] + ".zip")
        if path not in STATIC_FILES:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_GET()

    def do_HEAD(self):
        path = urlsplit(self.path).path
        if path not in STATIC_FILES:
            return self.send_error(HTTPStatus.NOT_FOUND)
        return super().do_HEAD()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == "/api/register":
            if rate_limited(self.client_address[0]):
                return self.json_response({"ok": False, "error": "too_many_attempts"}, HTTPStatus.TOO_MANY_REQUESTS)
            try:
                payload = self.json_body()
                username = validate_username(payload.get("username"))
                password = validate_password(payload.get("password"))
            except OverflowError:
                return self.json_response({"ok": False, "error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            except ValueError as exc:
                record_auth_failure(self.client_address[0])
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            salt, digest = new_password_record(password)
            user_id = str(uuid.uuid4())
            try:
                with db_lock, connect_db() as connection:
                    connection.execute(
                        "INSERT INTO users (id, username, username_norm, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        (user_id, username, username.casefold(), salt, digest, now_iso()),
                    )
                    connection.commit()
            except sqlite3.IntegrityError:
                record_auth_failure(self.client_address[0])
                return self.json_response({"ok": False, "error": "username_exists"}, HTTPStatus.CONFLICT)
            clear_auth_failures(self.client_address[0])
            with connect_db() as connection:
                user = public_user(connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
            token, session = make_session(user)
            return self.json_response(
                {"ok": True, "user": user, "csrf": session["csrf"]},
                HTTPStatus.CREATED,
                {"Set-Cookie": self.cookie_header(token)},
            )
        if path == "/api/login":
            if rate_limited(self.client_address[0]):
                return self.json_response({"ok": False, "error": "too_many_attempts"}, HTTPStatus.TOO_MANY_REQUESTS)
            try:
                payload = self.json_body()
                username_norm = str(payload.get("username", "")).strip().casefold()
                password = str(payload.get("password", ""))
            except (OverflowError, ValueError):
                return self.json_response({"ok": False, "error": "invalid_request"}, HTTPStatus.BAD_REQUEST)
            with connect_db() as connection:
                row = connection.execute("SELECT * FROM users WHERE username_norm = ?", (username_norm,)).fetchone()
            supplied = password_digest(password, row["password_salt"] if row else secrets.token_bytes(16).hex())
            if not row or not hmac.compare_digest(supplied, row["password_hash"]):
                record_auth_failure(self.client_address[0])
                return self.json_response({"ok": False, "error": "invalid_credentials"}, HTTPStatus.UNAUTHORIZED)
            clear_auth_failures(self.client_address[0])
            user = public_user(row)
            token, session = make_session(user)
            return self.json_response({"ok": True, "user": user, "csrf": session["csrf"]}, headers={"Set-Cookie": self.cookie_header(token)})
        if path == "/api/logout":
            return self.json_response({"ok": True}, headers={"Set-Cookie": self.cookie_header("", 0)})
        if path == "/api/password":
            user = self.require_auth(mutation=True)
            if not user:
                return
            try:
                payload = self.json_body()
                current = str(payload.get("current_password", ""))
                new_password = validate_password(payload.get("new_password"))
            except (OverflowError, ValueError) as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            with connect_db() as connection:
                row = connection.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
            if not hmac.compare_digest(password_digest(current, row["password_salt"]), row["password_hash"]):
                return self.json_response({"ok": False, "error": "invalid_current_password"}, HTTPStatus.UNAUTHORIZED)
            salt, digest = new_password_record(new_password)
            with db_lock, connect_db() as connection:
                connection.execute("UPDATE users SET password_salt = ?, password_hash = ?, force_password_change = 0 WHERE id = ?", (salt, digest, user["id"]))
                connection.commit()
            return self.json_response({"ok": True})
        if path == "/api/skills":
            user = self.require_auth(mutation=True)
            if not user:
                return
            try:
                payload = self.json_body()
                encoded = str(payload.get("content_base64", ""))
                package = base64.b64decode(encoded, validate=True)
                metadata = inspect_skill_zip(package)
                category = str(payload.get("category") or "其他")
                if category not in SKILL_CATEGORIES:
                    raise ValueError("无效的 Skill 分类")
            except OverflowError:
                return self.json_response({"ok": False, "error": "request_too_large"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            except (ValueError, binascii.Error) as exc:
                return self.json_response({"ok": False, "error": str(exc)}, HTTPStatus.BAD_REQUEST)
            timestamp = now_iso()
            with db_lock, connect_db() as connection:
                existing = connection.execute("SELECT id, created_at FROM skills WHERE owner_id = ? AND slug = ?", (user["id"], metadata["slug"])).fetchone()
                skill_id = existing["id"] if existing else str(uuid.uuid4())
                created_at = existing["created_at"] if existing else timestamp
                connection.execute(
                    "INSERT OR REPLACE INTO skills (id, owner_id, slug, name, description, category, source, package, package_sha256, file_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'user-upload', ?, ?, ?, ?, ?)",
                    (skill_id, user["id"], metadata["slug"], metadata["name"], metadata["description"], category, package, metadata["sha256"], metadata["file_count"], created_at, timestamp),
                )
                connection.commit()
            return self.json_response({"ok": True, "skill": {"id": skill_id, **metadata, "category": category, "created_at": created_at, "updated_at": timestamp}}, HTTPStatus.CREATED)
        if path == "/api/tokens":
            user = self.require_auth(mutation=True)
            if not user:
                return
            try:
                payload = self.json_body()
                label = str(payload.get("label") or "Agent token").strip()[:80]
            except (OverflowError, ValueError):
                return self.json_response({"ok": False, "error": "invalid_request"}, HTTPStatus.BAD_REQUEST)
            raw = "sd_" + secrets.token_urlsafe(32)
            token_id = str(uuid.uuid4())
            with db_lock, connect_db() as connection:
                connection.execute(
                    "INSERT INTO access_tokens (id, owner_id, label, token_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                    (token_id, user["id"], label or "Agent token", token_hash(raw), now_iso()),
                )
                connection.commit()
            return self.json_response({"ok": True, "token": raw, "id": token_id, "label": label}, HTTPStatus.CREATED)
        return self.json_response({"ok": False, "error": "not_found"}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        path = urlsplit(self.path).path
        user = self.require_auth(mutation=True)
        if not user:
            return
        skill_match = re.fullmatch(r"/api/skills/([a-f0-9-]+)", path)
        token_match = re.fullmatch(r"/api/tokens/([a-f0-9-]+)", path)
        if skill_match:
            with db_lock, connect_db() as connection:
                cursor = connection.execute("DELETE FROM skills WHERE id = ? AND owner_id = ?", (skill_match.group(1), user["id"]))
                connection.commit()
            if not cursor.rowcount:
                return self.json_response({"ok": False, "error": "skill_not_found"}, HTTPStatus.NOT_FOUND)
            return self.json_response({"ok": True})
        if token_match:
            with db_lock, connect_db() as connection:
                cursor = connection.execute("UPDATE access_tokens SET revoked_at = ? WHERE id = ? AND owner_id = ? AND revoked_at IS NULL", (now_iso(), token_match.group(1), user["id"]))
                connection.commit()
            if not cursor.rowcount:
                return self.json_response({"ok": False, "error": "token_not_found"}, HTTPStatus.NOT_FOUND)
            return self.json_response({"ok": True})
        return self.json_response({"ok": False, "error": "not_found"}, HTTPStatus.NOT_FOUND)


def main():
    parser = argparse.ArgumentParser(description="Serve the Skills Desk application")
    parser.add_argument("--host", default=os.environ.get("SKILLS_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8787")))
    args = parser.parse_args()
    if args.host not in {"127.0.0.1", "localhost", "::1", "0.0.0.0"}:
        parser.error("unsupported host")
    session_secret()
    initialize_database()
    server = ThreadingHTTPServer((args.host, args.port), SkillsHandler)
    print("Skills Desk: http://%s:%s" % (args.host, args.port), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
