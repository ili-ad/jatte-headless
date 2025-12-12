"""Tests covering room resolution and message creation identifiers."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")
os.environ.setdefault("DATABASE_SSL_REQUIRE", "false")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")
import django
from django.core.management import call_command

django.setup()
call_command("migrate", run_syncdb=True, verbosity=0)


from django.contrib.auth import get_user_model  # noqa: E402  pylint: disable=wrong-import-position
from rest_framework.test import APITestCase  # noqa: E402  pylint: disable=wrong-import-position
from stream_server_django.chat.models import Message, Room  # noqa: E402  pylint: disable=wrong-import-position

User = get_user_model()


class ResolveRoomEndpointTests(APITestCase):
    """Ensure resolve-room normalizes display names and preserves labels."""

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="resolver-user",
            email="resolver@example.com",
            password="pw",
            supabase_uid="resolver-uid",
        )

    def test_resolve_room_normalizes_name_and_keeps_label(self) -> None:
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/rooms/resolve/", {"label": "  agent-lab  "}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["name"], "agent-lab")

        room = Room.objects.get(uuid=payload["room_uuid"])
        self.assertEqual(room.data.get("name"), "agent-lab")
        self.assertEqual(room.data.get("label"), "  agent-lab  ")
        self.assertEqual(room.data.get("slug"), "agent-lab")


class RoomMessagesSenderIdentityTests(APITestCase):
    """Verify message creation uses a stable sender identifier."""

    def setUp(self) -> None:
        self.user = User.objects.create(
            username="",
            email="guest@example.com",
            supabase_uid="guest-uid",
        )
        self.room = Room.objects.create(uuid="message-room", client=self.user.supabase_uid)
        self.url = f"/api/rooms/{self.room.uuid}/messages/"

    def test_guest_message_uses_supabase_identifier(self) -> None:
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url, {"text": "hello"}, format="json")

        self.assertEqual(response.status_code, 200)
        payload = response.json()["message"]
        self.assertEqual(payload["user_id"], self.user.supabase_uid)

        message = Message.objects.get(id=payload["id"])
        self.assertEqual(message.sent_by, self.user.supabase_uid)
