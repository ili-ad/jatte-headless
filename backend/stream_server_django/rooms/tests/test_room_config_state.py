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
from stream_server_django.chat.utils import canonical_cid  # noqa: E402  pylint: disable=wrong-import-position
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


class RoomResolveAgentDefaultsTests(APITestCase):
    """Verify agent enablement defaults are persisted and surfaced in config-state."""

    def setUp(self) -> None:
        User = get_user_model()
        self.user = User.objects.create_user(username="agent-policy-user", password="pw")
        self.client.force_authenticate(self.user)

    def _resolve_room(self, label: str, **extra: object) -> str:
        payload = {"label": label, **extra}
        response = self.client.post("/api/rooms/resolve/", data=payload, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        return response.data["room_uuid"]

    def _config_state(self, room_uuid: str) -> dict:
        response = self.client.get(f"/api/rooms/{room_uuid}/config-state/")
        self.assertEqual(response.status_code, 200, response.content)
        return response.data

    def test_agent_lab_defaults_to_enabled(self) -> None:
        room_uuid = self._resolve_room("agent-lab")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertTrue(flag.agent_enabled)

        payload = self._config_state(room_uuid)
        self.assertTrue(payload["config"]["ai"]["enabled"])

    def test_support_defaults_to_enabled(self) -> None:
        room_uuid = self._resolve_room("Contact Us", purpose="support")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertTrue(flag.agent_enabled)

        payload = self._config_state(room_uuid)
        self.assertTrue(payload["config"]["ai"]["enabled"])

    def test_generic_room_defaults_to_disabled(self) -> None:
        room_uuid = self._resolve_room("general chat")
        flag = RoomAgentFlag.objects.get(room__uuid=room_uuid)
        self.assertFalse(flag.agent_enabled)

        payload = self._config_state(room_uuid)
        self.assertFalse(payload["config"]["ai"]["enabled"])

    def test_flag_overrides_policy(self) -> None:
        room_uuid = self._resolve_room("agent-lab")
        RoomAgentFlag.objects.filter(room__uuid=room_uuid).update(agent_enabled=False)

        canonical = canonical_cid(room_uuid, room_uuid=room_uuid)
        AgentRoomPolicy.objects.update_or_create(
            cid=canonical,
            defaults={"agent_enabled": True},
        )

        payload = self._config_state(room_uuid)
        self.assertFalse(payload["config"]["ai"]["enabled"])

    def test_existing_room_flag_is_not_overwritten(self) -> None:
        room = Room.objects.create(
            uuid="existing-room", client=self.user.username, data={"label": "agent-lab", "slug": "agent-lab"}
        )
        RoomAgentFlag.objects.create(room=room, agent_enabled=False)

        room_uuid = self._resolve_room("agent-lab")
        self.assertEqual(room_uuid, room.uuid)

        flag = RoomAgentFlag.objects.get(room=room)
        self.assertFalse(flag.agent_enabled)

        payload = self._config_state(room_uuid)
        self.assertFalse(payload["config"]["ai"]["enabled"])

    def test_config_state_persists_disabled_default(self) -> None:
        room = Room.objects.create(uuid="manual-room", client=self.user.username, data={"label": "manual"})

        payload = self._config_state(room.uuid)
        self.assertFalse(payload["config"]["ai"]["enabled"])

        flag = RoomAgentFlag.objects.get(room=room)
        self.assertFalse(flag.agent_enabled)

        canonical = canonical_cid(room.uuid, room_uuid=room.uuid)
        policy = AgentRoomPolicy.objects.get(cid=canonical)
        self.assertFalse(policy.agent_enabled)
