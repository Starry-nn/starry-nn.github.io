#!/usr/bin/env python3
"""Generate local SIGNAL admin credentials without storing plaintext in Git."""

import hashlib
import os
import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / "infra" / "admin.env"
CREDENTIAL_FILE = ROOT / "infra" / "admin-credentials.txt"
ITERATIONS = 240000


def main():
    username = "signal-admin-" + secrets.token_hex(3)
    password = secrets.token_hex(12)
    salt = secrets.token_bytes(16)
    password_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS).hex()
    session_secret = secrets.token_hex(32)
    ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    ENV_FILE.write_text(
        "SIGNAL_ADMIN_USERNAME=%s\nSIGNAL_ADMIN_PASSWORD_SALT=%s\nSIGNAL_ADMIN_PASSWORD_HASH=%s\nSIGNAL_SESSION_SECRET=%s\n"
        % (username, salt.hex(), password_digest, session_secret), encoding="utf-8",
    )
    CREDENTIAL_FILE.write_text(
        "SIGNAL 维护台账号（请勿上传或转发）\n\n账号：%s\n密码：%s\n\n登录地址：http://127.0.0.1:8765/admin.html\n"
        % (username, password), encoding="utf-8",
    )
    os.chmod(ENV_FILE, 0o600)
    os.chmod(CREDENTIAL_FILE, 0o600)
    print("账号：%s\n密码：%s\n凭据已写入：%s" % (username, password, CREDENTIAL_FILE))


if __name__ == "__main__":
    main()
