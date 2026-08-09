from pathlib import Path

from django.contrib.auth import get_user_model
from django.conf import settings
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Message


class HttpRequestBodyLimitTests(APITestCase):
    @override_settings(ROOT_URLCONF="jatte.urls", DATA_UPLOAD_MAX_MEMORY_SIZE=512)
    def test_oversized_json_body_is_rejected_without_mutation(self) -> None:
        user = get_user_model().objects.create_user(
            username="body-limit-user", supabase_uid="body-limit-user"
        )
        self.client.force_authenticate(user)

        response = self.client.post(
            reverse("link-preview"),
            {"url": "https://example.com/" + ("x" * 1024)},
            format="json",
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(Message.objects.count(), 0)

    @override_settings(ROOT_URLCONF="jatte.urls", DATA_UPLOAD_MAX_MEMORY_SIZE=2048)
    def test_normal_json_body_remains_accepted(self) -> None:
        user = get_user_model().objects.create_user(
            username="body-normal-user", supabase_uid="body-normal-user"
        )
        self.client.force_authenticate(user)
        response = self.client.post(
            reverse("link-preview"), {"url": "https://example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 200)


class ProductionServerLimitContractTests(SimpleTestCase):
    def test_application_limits_are_bounded(self) -> None:
        self.assertEqual(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 2 * 1024 * 1024)
        self.assertEqual(settings.WS_MAX_EVENT_BYTES, 256 * 1024)

    def test_daphne_and_http_server_limits_are_explicit(self) -> None:
        backend = Path(__file__).resolve().parents[3]
        daphne = (backend / "serverfiles" / "daphne_start").read_text()
        gunicorn = (backend / "serverfiles" / "gunicorn_start").read_text()
        nginx = (backend / "serverfiles" / "nginx_jatte.conf").read_text()

        self.assertIn("--websocket-max-frame-size 1048576", daphne)
        self.assertIn("--websocket-max-message-size 1048576", daphne)
        self.assertIn("--http-timeout 60", daphne)
        self.assertIn("TIMEOUT=60", gunicorn)
        self.assertIn("client_max_body_size 2m", nginx)
        self.assertIn("proxy_read_timeout 60s", nginx)
