"""Tests covering the room configuration state endpoint."""

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

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402  pylint: disable=wrong-import-position
from django.core.management import call_command  # noqa: E402  pylint: disable=wrong-import-position
from django.urls import reverse  # noqa: E402  pylint: disable=wrong-import-position
from rest_framework.test import APITestCase  # noqa: E402  pylint: disable=wrong-import-position

call_command("migrate", run_syncdb=True, verbosity=0)

from chat.models import Room  # noqa: E402  pylint: disable=wrong-import-position


class RoomConfigStateTests(APITestCase):
    """Ensure the composer config endpoint matches the documented contract."""

    def setUp(self) -> None:
        User = get_user_model()
        self.user = User.objects.create_user(username="composer", password="pw")
        self.room = Room.objects.create(
            uuid="config-room",
            client=self.user.username,
            data={"composer": {"file_uploads": False, "max_length": 9000}},
        )
        self.url = reverse("rooms:config-state", kwargs={"room_uuid": self.room.uuid})

    def authenticate(self) -> None:
        self.client.force_authenticate(self.user)

    def test_returns_composer_payload(self) -> None:
        """The response should wrap the composer settings in a `composer` key."""

        self.authenticate()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        payload = response.data
        self.assertIn("config", payload)
        composer = payload["config"]["composer"]
        self.assertEqual(composer["file_uploads"], False)
        self.assertEqual(composer["max_length"], 9000)
        self.assertEqual(composer["cooldown_seconds"], 0)
        ai_config = payload["config"]["ai"]
        self.assertIn("enabled", ai_config)
        self.assertEqual(ai_config["displayName"], "Assistant")

    def test_requires_authentication(self) -> None:
        """Unauthenticated requests should be rejected."""

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_rejects_non_participants(self) -> None:
        """Users without access to the room receive 403."""

        User = get_user_model()
        outsider = User.objects.create_user(username="outsider", password="pw")
        url = reverse("rooms:config-state", kwargs={"room_uuid": self.room.uuid})

        self.client.force_authenticate(outsider)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_missing_room_returns_404(self) -> None:
        """Requests referencing an unknown room should 404."""

        self.authenticate()
        url = reverse("rooms:config-state", kwargs={"room_uuid": "missing-room"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_prefixed_identifier_supported(self) -> None:
        """The endpoint should accept `messaging:` style identifiers."""

        self.authenticate()
        url = reverse(
            "rooms:config-state", kwargs={"room_uuid": f"messaging:{self.room.uuid}"}
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("composer", response.data)
