"""Subprocess coverage for the real production Django boundary."""

from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys

from django.test import SimpleTestCase


BACKEND_DIR = Path(__file__).resolve().parents[2]

PRODUCTION_ENV = {
    "DJANGO_SETTINGS_MODULE": "jatte.settingsprod",
    "JATTE_LOAD_DOTENV": "false",
    "DJANGO_SECRET_KEY": "ci-only-django-secret-with-sufficient-length-and-entropy-PR11",
    "SUPABASE_JWT_SECRET": "ci-only-supabase-secret-with-sufficient-length-PR11",
    "SUPABASE_JWT_ISSUER": "https://example.supabase.co/auth/v1",
    "SUPABASE_JWT_AUDIENCE": "authenticated",
    "DJANGO_ALLOWED_HOSTS": "jatte.example.test",
    "DJANGO_CORS_ALLOWED_ORIGINS": "https://app.example.test",
    "DJANGO_WS_ALLOWED_ORIGINS": "https://app.example.test",
    "CHAT_INTERNAL_SERVICE_TOKEN": "ci-only-internal-service-token-PR11",
    "SMS_WEBHOOK_SECRET": "ci-only-sms-webhook-secret-PR11",
    "DATABASE_URL": "postgresql://ci_user:ci_password@127.0.0.1:5432/jatte_ci",
    "DATABASE_SSL_REQUIRE": "true",
    "REDIS_HOST": "127.0.0.1",
    "REDIS_PORT": "6379",
}


class ProductionSettingsBootstrapTests(SimpleTestCase):
    maxDiff = None

    def _run_python(self, source: str) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        for name in (
            "NEXT_PUBLIC_SUPABASE_URL",
            "SUPABASE_JWKS_URL",
            "SECURE_HSTS_SECONDS",
        ):
            env.pop(name, None)
        env.update(PRODUCTION_ENV)
        return subprocess.run(
            [sys.executable, "-c", source],
            cwd=BACKEND_DIR,
            env=env,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_real_production_django_asgi_and_wsgi_bootstrap(self):
        result = self._run_python(
            """
import json
import django
django.setup()
from django.apps import apps
from django.contrib.auth import get_user_model
from django.urls import get_resolver
from jatte.asgi import application as asgi_application
from jatte.wsgi import application as wsgi_application
from django.conf import settings
print(json.dumps({
    "apps_ready": apps.ready,
    "user_model": get_user_model()._meta.label,
    "urlconf": get_resolver().urlconf_name,
    "asgi": asgi_application is not None,
    "wsgi": wsgi_application is not None,
    "auth_model": settings.AUTH_USER_MODEL,
}))
"""
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertEqual(
            payload,
            {
                "apps_ready": True,
                "user_model": "accounts_supabase.CustomUser",
                "urlconf": "jatte.urls",
                "asgi": True,
                "wsgi": True,
                "auth_model": "accounts_supabase.CustomUser",
            },
        )

    def test_production_preserves_shared_topology_and_security_invariants(self):
        result = self._run_python(
            """
import json
import django
django.setup()
from django.conf import settings
print(json.dumps({
    "apps": settings.INSTALLED_APPS,
    "auth_model": settings.AUTH_USER_MODEL,
    "channel_backend": settings.CHANNEL_LAYERS["default"]["BACKEND"],
    "database_engine": settings.DATABASES["default"]["ENGINE"],
    "database_host": settings.DATABASES["default"]["HOST"],
    "rest_auth": settings.REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"],
    "throttles": sorted(settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]),
    "debug": settings.DEBUG,
    "ssl_redirect": settings.SECURE_SSL_REDIRECT,
    "session_secure": settings.SESSION_COOKIE_SECURE,
    "csrf_secure": settings.CSRF_COOKIE_SECURE,
    "hsts": settings.SECURE_HSTS_SECONDS,
    "hsts_subdomains": settings.SECURE_HSTS_INCLUDE_SUBDOMAINS,
    "hsts_preload": settings.SECURE_HSTS_PRELOAD,
    "issuer": settings.SUPABASE_JWT_ISSUER,
    "audience": settings.SUPABASE_JWT_AUDIENCE,
}))
"""
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout.strip().splitlines()[-1])
        expected_apps = {
            "pgvector.django",
            "stream_server_django.accounts_supabase",
            "stream_server_django.mutes",
            "stream_server_django.reminders",
            "stream_server_django.rooms",
            "stream_server_django.events",
            "stream_server_django.state",
            "stream_server_django.polls",
            "stream_server_django.chat_addons",
            "stream_server_django.chat_addons.agent",
        }
        self.assertTrue(expected_apps.issubset(payload["apps"]))
        self.assertEqual(payload["auth_model"], "accounts_supabase.CustomUser")
        self.assertEqual(
            payload["channel_backend"], "channels_redis.core.RedisChannelLayer"
        )
        self.assertEqual(payload["database_engine"], "django.db.backends.postgresql")
        self.assertEqual(payload["database_host"], "127.0.0.1")
        self.assertEqual(
            payload["rest_auth"],
            [
                "stream_server_django.accounts_supabase.authentication.DevTokenOrJWTAuthentication"
            ],
        )
        self.assertEqual(
            payload["throttles"],
            [
                "message-burst",
                "message-sustained",
                "reaction-burst",
                "reaction-sustained",
            ],
        )
        self.assertFalse(payload["debug"])
        self.assertTrue(payload["ssl_redirect"])
        self.assertTrue(payload["session_secure"])
        self.assertTrue(payload["csrf_secure"])
        self.assertGreater(payload["hsts"], 0)
        self.assertFalse(payload["hsts_subdomains"])
        self.assertFalse(payload["hsts_preload"])
        self.assertEqual(payload["issuer"], PRODUCTION_ENV["SUPABASE_JWT_ISSUER"])
        self.assertEqual(payload["audience"], "authenticated")

    def test_production_settings_do_not_load_developer_dotenv(self):
        result = self._run_python(
            """
from unittest.mock import patch
with patch("dotenv.load_dotenv") as load_dotenv:
    import jatte.settingsprod
    assert not load_dotenv.called
"""
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_partial_attachment_scanner_configuration_fails_closed(self):
        env = os.environ.copy()
        env.update(PRODUCTION_ENV)
        env["CHAT_ATTACHMENTS_PENDING_BUCKET"] = "pending-only"
        result = subprocess.run(
            [sys.executable, "-c", "import jatte.settingsprod"],
            cwd=BACKEND_DIR,
            env=env,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("CHAT_ATTACHMENTS_SCANNER_BACKEND", result.stderr)

    def test_attachment_storage_requires_a_signing_identity(self):
        env = os.environ.copy()
        env.update(PRODUCTION_ENV)
        env.update(
            {
                "CHAT_ATTACHMENTS_PENDING_BUCKET": "pending",
                "CHAT_ATTACHMENTS_CLEAN_BUCKET": "clean",
                "CHAT_ATTACHMENTS_QUARANTINE_BUCKET": "quarantine",
                "CHAT_ATTACHMENTS_SCANNER_BACKEND": "gcp_clamav",
                "CHAT_ATTACHMENTS_SCANNER_URL": "https://scanner.example.test",
                "CHAT_ATTACHMENTS_SCANNER_AUDIENCE": "https://scanner.example.test",
                "CHAT_ATTACHMENTS_ALLOWED_TYPES": "text/plain",
            }
        )
        env.pop("CHAT_ATTACHMENTS_SIGNING_SERVICE_ACCOUNT", None)
        env.pop("CHAT_ATTACHMENTS_SERVICE_ACCOUNT_JSON", None)
        result = subprocess.run(
            [sys.executable, "-c", "import jatte.settingsprod"],
            cwd=BACKEND_DIR,
            env=env,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("CHAT_ATTACHMENTS_SIGNING_SERVICE_ACCOUNT", result.stderr)
