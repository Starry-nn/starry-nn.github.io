#!/usr/bin/env python3
"""Generate hashed admin credentials without storing the plaintext password."""

import getpass
import hashlib
import secrets


ITERATIONS = 310_000


def main():
    username = input("Admin username: ").strip()
    password = getpass.getpass("Temporary password: ")
    if len(username) < 3 or len(password) < 8:
        raise SystemExit("Username must have 3+ characters and password must have 8+ characters")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS).hex()
    print("SKILLS_ADMIN_USERNAME=" + username)
    print("SKILLS_ADMIN_PASSWORD_SALT=" + salt.hex())
    print("SKILLS_ADMIN_PASSWORD_HASH=" + digest)
    print("SKILLS_SESSION_SECRET=" + secrets.token_urlsafe(48))


if __name__ == "__main__":
    main()
