from __future__ import annotations

from unittest import mock

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

from django.core.management import call_command

call_command("migrate", run_syncdb=True, verbosity=0)

import jwt
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts_supabase.models import CustomUser
from chat.models import Message, Room
from backend.chat_addons.agent.models import RoomAgentFlag


class AgentViewsTests(APITestCase):
    def setUp(self) -> None:
        self.operator, _ = CustomUser.objects.get_or_create(
            username="operator-1",
            defaults={
                "email": "operator1@example.com",
                "supabase_uid": "operator-1",
            },
        )
        if not self.operator.has_usable_password():
            self.operator.set_password("secret")
            self.operator.save(update_fields=["password"])

    def make_token(self) -> str:
        return jwt.encode(
            {"sub": self.operator.supabase_uid, "email": self.operator.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Bearer {self.make_token()}"}

    def test_status_defaults_to_disabled(self) -> None:
        room = Room.objects.create(uuid="status-room", client="stream")
        url = reverse("agent-status", kwargs={"cid": "messaging:status-room"})

        response = self.client.get(url, **self.auth_headers())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload["cid"], "messaging:status-room")
        self.assertFalse(payload["agent_enabled"])
        self.assertIsNone(payload["updated_at"])
        self.assertFalse(RoomAgentFlag.objects.filter(room=room).exists())

    def test_enable_and_disable_agent(self) -> None:
        room = Room.objects.create(uuid="toggle-room", client="stream")
        enable_url = reverse("enable-agent", kwargs={"cid": "messaging:toggle-room"})
        disable_url = reverse("disable-agent", kwargs={"cid": "messaging:toggle-room"})

        enable_response = self.client.post(enable_url, {}, **self.auth_headers())
        self.assertEqual(enable_response.status_code, status.HTTP_200_OK)
        enable_payload = enable_response.json()
        self.assertTrue(enable_payload["agent_enabled"])

        flag = RoomAgentFlag.objects.get(room=room)
        self.assertTrue(flag.agent_enabled)

        disable_response = self.client.post(disable_url, {}, **self.auth_headers())
        self.assertEqual(disable_response.status_code, status.HTTP_200_OK)
        disable_payload = disable_response.json()
        self.assertFalse(disable_payload["agent_enabled"])

        flag.refresh_from_db()
        self.assertFalse(flag.agent_enabled)

    @mock.patch("backend.chat_addons.agent.tasks._broadcast_to_cid")
    @mock.patch("backend.chat_addons.agent.tasks.get_agent_service")
    def test_invoke_creates_message(
        self,
        mock_get_service: mock.MagicMock,
        mock_broadcast: mock.MagicMock,
    ) -> None:
        Room.objects.create(uuid="invoke-room", client="stream")
        service = mock.Mock()
        service.generate.return_value = "pong"
        mock_get_service.return_value = service

        url = reverse("invoke-agent", kwargs={"cid": "messaging:invoke-room"})
        response = self.client.post(
            url,
            {"prompt": "ping"},
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        payload = response.json()
        self.assertEqual(payload["status"], "queued")
        self.assertIn("run_id", payload)

        messages = Message.objects.filter(channel__uuid="invoke-room", sent_by="agent-bot")
        self.assertEqual(messages.count(), 1)
        self.assertEqual(messages.first().body, "pong")
        mock_broadcast.assert_called()
