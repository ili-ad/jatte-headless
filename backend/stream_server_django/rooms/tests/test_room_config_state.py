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
from django.test import override_settings  # noqa: E402  pylint: disable=wrong-import-position
import jwt  # noqa: E402  pylint: disable=wrong-import-position
from rest_framework.test import APITestCase  # noqa: E402  pylint: disable=wrong-import-position

call_command("migrate", run_syncdb=True, verbosity=0)

from stream_server_django.chat.models import Room  # noqa: E402  pylint: disable=wrong-import-position
from stream_server_django.chat_addons.agent.models import (  # noqa: E402  pylint: disable=wrong-import-position
    AgentRoomPolicy,
    RoomAgentFlag,
)


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
        self.url = f"/api/rooms/{self.room.uuid}/config-state/"

    def authenticate(self) -> None:
        self.client.force_authenticate(self.user)

    def guest_token(self, sub: str = "anon-user") -> str:
        return jwt.encode(
            {"sub": sub, "is_anonymous": True, "app_metadata": {"provider": "anonymous"}},
            "secret",
        )

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
        url = f"/api/rooms/{self.room.uuid}/config-state/"

        self.client.force_authenticate(outsider)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_missing_room_returns_404(self) -> None:
        """Requests referencing an unknown room should 404."""

        self.authenticate()
        url = "/api/rooms/missing-room/config-state/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_prefixed_identifier_supported(self) -> None:
        """The endpoint should accept `messaging:` style identifiers."""

        self.authenticate()
        url = f"/api/rooms/messaging:{self.room.uuid}/config-state/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("composer", response.data.get("config", {}))

    def test_room_flag_overrides_disabled_policy(self) -> None:
        """A room-level flag should enable the agent even if policy disables it."""

        self.authenticate()
        AgentRoomPolicy.objects.create(cid=self.room.cid, agent_enabled=False)
        RoomAgentFlag.objects.create(room=self.room, agent_enabled=True)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["config"]["ai"]["enabled"])

    def test_room_flag_overrides_enabled_policy(self) -> None:
        """A room-level flag should disable the agent even if policy enables it."""

        self.authenticate()
        AgentRoomPolicy.objects.create(cid=self.room.cid, agent_enabled=True)
        RoomAgentFlag.objects.create(room=self.room, agent_enabled=False)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["config"]["ai"]["enabled"])

    @override_settings(PUBLIC_AGENT_ROOM_SLUGS=["agent-lab"])
    def test_guest_can_read_public_agent_room(self) -> None:
        """Guest Supabase sessions may read config for public agent rooms."""

        User = get_user_model()
        guest_user = User.objects.create_user(
            username="anon-uid",
            email="anon@example.com",
            password="pw",
            supabase_uid="anon-uid",
        )
        room = Room.objects.create(uuid="agent-lab", client="agent-lab", data={})

        url = f"/api/rooms/{room.uuid}/config-state/"
        self.client.force_authenticate(guest_user, token=self.guest_token("anon-uid"))

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("config", response.data)

    @override_settings(PUBLIC_AGENT_ROOM_SLUGS=["agent-lab"])
    def test_guest_rejected_for_non_public_room(self) -> None:
        """Guests should still be blocked from rooms that are not public."""

        User = get_user_model()
        guest_user = User.objects.create_user(
            username="anon-uid-2",
            email="anon2@example.com",
            password="pw",
            supabase_uid="anon-uid-2",
        )
        private_room = Room.objects.create(uuid="private-room", client="private-room", data={})
        url = f"/api/rooms/{private_room.uuid}/config-state/"
        self.client.force_authenticate(guest_user, token=self.guest_token("anon-uid-2"))

        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)


class RoomResolveAIDefaultTests(APITestCase):
    """Validate AI defaults are applied at room creation time."""

    def setUp(self) -> None:
        User = get_user_model()
        self.user = User.objects.create_user(username="resolver", password="pw")

    def authenticate(self) -> None:
        self.client.force_authenticate(self.user)

    def _resolve_room(self, label: str, purpose: str | None = None) -> str:
        payload: dict[str, str] = {"label": label}
        if purpose:
            payload["purpose"] = purpose
        response = self.client.post("/api/rooms/resolve/", data=payload, format="json")
        self.assertEqual(response.status_code, 200)
        room_uuid = response.data["room_uuid"]
        self.assertTrue(room_uuid)
        return room_uuid

    def test_support_room_persists_enabled_default(self) -> None:
        self.authenticate()
        room_uuid = self._resolve_room("support/contact-us", purpose="support")

        policy = AgentRoomPolicy.objects.get(cid=f"messaging:{room_uuid}")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertTrue(policy.agent_enabled)
        self.assertTrue(flag.agent_enabled)

        url = f"/api/rooms/{room_uuid}/config-state/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["config"]["ai"]["enabled"])

    def test_agent_lab_slug_is_not_auto_enabled(self) -> None:
        """The 'agent-lab' label behaves like any other room unless explicitly configured."""

        self.authenticate()
        room_uuid = self._resolve_room("agent-lab")

        policy = AgentRoomPolicy.objects.get(cid=f"messaging:{room_uuid}")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertFalse(policy.agent_enabled)
        self.assertFalse(flag.agent_enabled)

    def test_generic_room_persists_disabled_default(self) -> None:
        self.authenticate()
        room_uuid = self._resolve_room("general-chat")

        policy = AgentRoomPolicy.objects.get(cid=f"messaging:{room_uuid}")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertFalse(policy.agent_enabled)
        self.assertFalse(flag.agent_enabled)

        url = f"/api/rooms/{room_uuid}/config-state/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["config"]["ai"]["enabled"])
