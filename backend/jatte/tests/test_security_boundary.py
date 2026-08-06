import importlib
import os
import sys
from unittest.mock import patch

import jwt

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from jatte.security_settings import ProductionConfigurationError, required_csv, required_secret


class ProductionSettingsHelperTests(TestCase):
    production_environ = {
        "DJANGO_SECRET_KEY": "real-django-secret",
        "SUPABASE_JWT_SECRET": "real-supabase-secret",
        "DJANGO_ALLOWED_HOSTS": "chat.example,api.example",
        "DJANGO_CORS_ALLOWED_ORIGINS": "https://app.example",
        "DJANGO_WS_ALLOWED_ORIGINS": "https://app.example",
    }

    def _load_production_settings(self, environ):
        sys.modules.pop("jatte.settingsprod", None)
        with patch.dict(os.environ, environ, clear=True):
            return importlib.import_module("jatte.settingsprod")

    def test_required_secret_rejects_missing_and_placeholder_values(self):
        for value in ("", "changeme", "change-me", "django-insecure-value"):
            with self.assertRaises(ProductionConfigurationError):
                required_secret("DJANGO_SECRET_KEY", {"DJANGO_SECRET_KEY": value})

    def test_required_secret_accepts_explicit_value(self):
        self.assertEqual(
            required_secret("DJANGO_SECRET_KEY", {"DJANGO_SECRET_KEY": "real-secret"}),
            "real-secret",
        )

    def test_required_csv_requires_explicit_non_wildcard_values(self):
        with self.assertRaises(ProductionConfigurationError):
            required_csv("DJANGO_CORS_ALLOWED_ORIGINS", {})
        with self.assertRaises(ProductionConfigurationError):
            required_csv("DJANGO_CORS_ALLOWED_ORIGINS", {"DJANGO_CORS_ALLOWED_ORIGINS": "*"})
        self.assertEqual(
            required_csv(
                "DJANGO_WS_ALLOWED_ORIGINS",
                {"DJANGO_WS_ALLOWED_ORIGINS": "https://app.example, https://admin.example/"},
            ),
            ["https://app.example", "https://admin.example"],
        )

    def test_production_host_and_cors_allowlists_parse_explicit_values(self):
        environ = {
            "DJANGO_ALLOWED_HOSTS": "chat.example, api.example",
            "DJANGO_CORS_ALLOWED_ORIGINS": "https://app.example,https://admin.example",
        }
        self.assertEqual(
            required_csv("DJANGO_ALLOWED_HOSTS", environ),
            ["chat.example", "api.example"],
        )
        self.assertEqual(
            required_csv("DJANGO_CORS_ALLOWED_ORIGINS", environ),
            ["https://app.example", "https://admin.example"],
        )

    def test_production_settings_fail_closed_and_parse_explicit_boundary_values(self):
        with self.assertRaises(ProductionConfigurationError):
            self._load_production_settings({})

        configured = self._load_production_settings(self.production_environ)
        self.assertFalse(configured.DEBUG)
        self.assertEqual(configured.ALLOWED_HOSTS, ["chat.example", "api.example"])
        self.assertEqual(configured.CORS_ALLOWED_ORIGINS, ["https://app.example"])
        self.assertEqual(configured.DJANGO_WS_ALLOWED_ORIGINS, ["https://app.example"])
        self.assertFalse(configured.CORS_ALLOW_CREDENTIALS)


@override_settings(ROOT_URLCONF="jatte.tests.urls_security", DEBUG=False)
class AuthBoundaryRegressionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _token(self, sub="auth-boundary-user"):
        return jwt.encode(
            {"sub": sub, "email": f"{sub}@example.com"},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_x_user_id_does_not_authenticate_a_legacy_view(self):
        response = self.client.get("/api/ws-auth/", HTTP_X_USER_ID="impersonated-user")
        self.assertEqual(response.status_code, 403)

        token_response = self.client.get("/api/token/", HTTP_X_USER_ID="impersonated-user")
        self.assertEqual(token_response.status_code, 403)

    def test_missing_and_invalid_bearer_tokens_are_rejected(self):
        missing = self.client.get("/api/connection-id/")
        invalid = self.client.get(
            "/api/connection-id/", HTTP_AUTHORIZATION="Bearer not-a-jwt"
        )
        self.assertEqual(missing.status_code, 403)
        self.assertEqual(invalid.status_code, 403)

    def test_session_cookie_is_not_an_authentication_substitute(self):
        self.client.force_login(get_user_model().objects.create_user(username="session-user"))
        response = self.client.post(
            "/api/editing-audit-state/", {"draft_update": 1}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_legacy_websocket_url_uses_ws_for_http_and_wss_for_https(self):
        token = self._token()
        http = self.client.get(
            "/api/ws-auth/", HTTP_AUTHORIZATION=f"Bearer {token}", HTTP_HOST="testserver"
        )
        https = self.client.get(
            "/api/ws-auth/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
            HTTP_HOST="testserver",
            secure=True,
        )
        self.assertTrue(http.data["stream_server_django.auth"].startswith("ws://testserver/ws/?token="))
        self.assertTrue(https.data["stream_server_django.auth"].startswith("wss://testserver/ws/?token="))

    @override_settings(
        SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
        USE_X_FORWARDED_HOST=True,
        ALLOWED_HOSTS=["testserver", "chat.example"],
    )
    def test_legacy_websocket_url_honors_configured_tls_proxy_header(self):
        response = self.client.get(
            "/api/ws-auth/",
            HTTP_AUTHORIZATION=f"Bearer {self._token()}",
            HTTP_HOST="chat.example",
            HTTP_X_FORWARDED_PROTO="https",
        )
        self.assertTrue(response.data["stream_server_django.auth"].startswith("wss://chat.example/ws/?token="))
