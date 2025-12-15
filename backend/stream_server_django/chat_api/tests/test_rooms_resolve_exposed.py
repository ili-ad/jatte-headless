"""Ensure the room resolver is exposed via the chat API URL pack."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")
os.environ.setdefault("DATABASE_SSL_REQUIRE", "false")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402  pylint: disable=wrong-import-position
from django.core.management import call_command  # noqa: E402  pylint: disable=wrong-import-position
from django.test import override_settings  # noqa: E402  pylint: disable=wrong-import-position
from rest_framework.test import APITestCase  # noqa: E402  pylint: disable=wrong-import-position

call_command("migrate", run_syncdb=True, verbosity=0)


@override_settings(ROOT_URLCONF="stream_server_django.chat_api.urls")
class ChatApiResolveRoomExposureTests(APITestCase):
    """Validate that the resolve endpoint is exposed in chat_api URL pack."""

    def setUp(self) -> None:
        User = get_user_model()
        self.user = User.objects.create_user(username="resolver", password="pw")
        self.client.force_authenticate(self.user)

    def test_resolve_with_trailing_slash(self) -> None:
        response = self.client.post(
            "/api/rooms/resolve/", data={"label": "support/contact-us"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("room_uuid"))

    def test_resolve_without_trailing_slash(self) -> None:
        response = self.client.post(
            "/api/rooms/resolve", data={"label": "support/contact-us"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data.get("room_uuid"))

    def test_requires_auth(self) -> None:
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/rooms/resolve/", data={"label": "support/contact-us"}, format="json"
        )
        self.assertEqual(response.status_code, 403)
