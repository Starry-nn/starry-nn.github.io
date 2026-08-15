# SIGNAL backend source

This directory is the version-controlled source for the private maintenance backend. GitHub Pages does not execute Python, so the live backend remains on the owner's machine or a separately protected server.

Run locally from this directory:

```bash
python3 scripts/admin_credentials.py
python3 scripts/server.py --host 127.0.0.1 --port 8765
```

Open `http://127.0.0.1:8765/admin.html`. Store the generated `infra/admin.env` and `infra/admin-credentials.txt` locally; they are intentionally excluded from GitHub. Runtime data under `data/` is also local-only.

The backend includes:

- password login with PBKDF2-SHA256 and signed HttpOnly sessions;
- RSS/source CRUD, enable/disable, JSON/CSV import, JSON export and single-source test runs;
- fixed maintenance jobs, source backups and audit logs;
- public-bundle validation and GitHub Pages publishing.

Never commit `admin.env`, plaintext credentials, access keys, cookies, candidate data or WeRSS secrets. Configure WeRSS credentials through environment variables documented in `docs/WECHAT_RSS.md`.
