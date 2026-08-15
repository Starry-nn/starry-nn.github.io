# SIGNAL backend source

This directory is the version-controlled source for the protected maintenance backend. GitHub Pages does not execute Python; use the included Dockerfile to run it on Railway or another container host while keeping the source in GitHub.

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

## Railway deployment

Create a Railway service from this GitHub repository and set its root directory to `/signal-weekly/backend`. Railway will build the included `Dockerfile`; the server reads Railway's `PORT` automatically and binds to `0.0.0.0` only when password authentication is configured.

Configure these Railway variables in the service settings. Values are secrets and must not be committed:

- `SIGNAL_ADMIN_USERNAME`
- `SIGNAL_ADMIN_PASSWORD_SALT`
- `SIGNAL_ADMIN_PASSWORD_HASH`
- `SIGNAL_SESSION_SECRET`
- `SIGNAL_STATE_DIR=/data`

Add a persistent Railway volume mounted at `/data`. On first boot, the bundled source registry is copied to the volume; subsequent source edits, backups, audit records and job state remain on that volume across deployments. Generate a public Railway domain only after the variables and volume are configured.

The HTTP server exposes only the reading/admin assets and authenticated API. Paths under `infra/`, `config/`, `scripts/`, `tests/` and `docs/` are not served as static files. `/api/health` remains public for Railway health checks; all maintenance data APIs require login, and write actions also require the console's action header.
