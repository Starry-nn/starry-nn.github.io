import base64
import hashlib
import http.client
import io
import json
import os
import tempfile
import threading
import unittest
import zipfile
from pathlib import Path

import server


def make_skill_zip(name="deal-notes", description="Turn deal notes into an IC-ready brief.", extra=None, frontmatter_name=None):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "%s/SKILL.md" % name,
            "---\nname: %s\ndescription: %s\n---\n\n# Instructions\n" % (frontmatter_name or name, description),
        )
        archive.writestr("%s/references/checklist.md" % name, "# Checklist\n")
        if extra:
            archive.writestr(extra[0], extra[1])
    return output.getvalue()


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        server.STATE_ROOT = Path(self.temp_dir.name)
        server.DB_PATH = server.STATE_ROOT / "skills-desk.sqlite3"
        salt = bytes.fromhex("00112233445566778899aabbccddeeff").hex()
        os.environ["SKILLS_SESSION_SECRET"] = "test-session-secret-that-is-long-enough-123456"
        os.environ["SKILLS_ADMIN_USERNAME"] = "Starry"
        os.environ["SKILLS_ADMIN_PASSWORD_SALT"] = salt
        os.environ["SKILLS_ADMIN_PASSWORD_HASH"] = server.password_digest("Monolith", salt)
        server.auth_failures.clear()
        server.initialize_database()
        self.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.SkillsHandler)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.cookie = None
        self.csrf = None

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=2)
        self.temp_dir.cleanup()

    def request(self, method, path, payload=None, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        request_headers = dict(headers or {})
        if self.cookie:
            request_headers["Cookie"] = self.cookie
        if self.csrf and method in {"POST", "DELETE", "PUT", "PATCH"}:
            request_headers.setdefault("X-CSRF-Token", self.csrf)
        body = None
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            request_headers["Content-Type"] = "application/json"
        connection.request(method, path, body=body, headers=request_headers)
        response = connection.getresponse()
        data = response.read()
        set_cookie = response.getheader("Set-Cookie")
        if set_cookie:
            self.cookie = set_cookie.split(";", 1)[0]
        content_type = response.getheader("Content-Type", "")
        decoded = json.loads(data) if "application/json" in content_type else data
        status = response.status
        connection.close()
        return status, decoded

    def login_starry(self):
        status, payload = self.request("POST", "/api/login", {"username": "Starry", "password": "Monolith"})
        self.assertEqual(status, 200)
        self.csrf = payload["csrf"]
        self.assertTrue(payload["user"]["force_password_change"])

    def change_initial_password(self):
        status, payload = self.request(
            "POST",
            "/api/password",
            {"current_password": "Monolith", "new_password": "NewMonolith2026!"},
        )
        self.assertEqual((status, payload["ok"]), (200, True))
        status, payload = self.request("GET", "/api/auth")
        self.assertEqual(status, 200)
        self.assertFalse(payload["user"]["force_password_change"])

    def upload(self, package=None):
        package = package or make_skill_zip()
        return self.request(
            "POST",
            "/api/skills",
            {"category": "IC 材料", "content_base64": base64.b64encode(package).decode("ascii")},
        )

    def test_public_catalog_and_health(self):
        status, health = self.request("GET", "/api/health")
        self.assertEqual((status, health["service"]), (200, "skills-desk"))
        status, catalog = self.request("GET", "/api/public-skills")
        self.assertEqual(status, 200)
        self.assertGreater(len(catalog["skills"]), 20)

    def test_password_gate_upload_token_and_bundle(self):
        self.login_starry()
        status, blocked = self.upload()
        self.assertEqual((status, blocked["error"]), (403, "password_change_required"))
        self.change_initial_password()

        package = make_skill_zip()
        status, uploaded = self.upload(package)
        self.assertEqual((status, uploaded["skill"]["slug"]), (201, "deal-notes"))
        self.assertEqual(uploaded["skill"]["sha256"], hashlib.sha256(package).hexdigest())

        status, token_payload = self.request("POST", "/api/tokens", {"label": "Codex laptop"})
        self.assertEqual(status, 201)
        token = token_payload["token"]
        self.cookie = None
        self.csrf = None
        status, bundle = self.request("GET", "/api/bundle", headers={"Authorization": "Bearer " + token})
        self.assertEqual(status, 200)
        with zipfile.ZipFile(io.BytesIO(bundle)) as archive:
            self.assertIn("deal-notes/SKILL.md", archive.namelist())

    def test_registered_user_cannot_see_starry_skill(self):
        self.login_starry()
        self.change_initial_password()
        self.assertEqual(self.upload()[0], 201)

        self.cookie = None
        self.csrf = None
        status, registered = self.request(
            "POST",
            "/api/register",
            {"username": "other-investor", "password": "PrivateVault2026!"},
        )
        self.assertEqual(status, 201)
        self.csrf = registered["csrf"]
        status, listing = self.request("GET", "/api/skills")
        self.assertEqual((status, listing["skills"]), (200, []))
        status, empty_bundle = self.request("GET", "/api/bundle")
        self.assertEqual(status, 409)
        self.assertIn("还没有", empty_bundle["error"])

    def test_rejects_path_traversal_and_name_mismatch(self):
        self.login_starry()
        self.change_initial_password()
        unsafe = make_skill_zip(extra=("../secret.txt", "nope"))
        status, payload = self.upload(unsafe)
        self.assertEqual(status, 400)
        self.assertIn("不安全", payload["error"])

        mismatch = make_skill_zip(name="deal-notes", frontmatter_name="wrong-name")
        status, payload = self.upload(mismatch)
        self.assertEqual(status, 400)


if __name__ == "__main__":
    unittest.main()
