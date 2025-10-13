from __future__ import annotations

import json
import os
import sys
from decimal import Decimal
from pathlib import Path
from unittest import mock

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Message
from chat_addons.agent.models import AgentRoomPolicy, AgentRun
from chat_addons.agent.services.agent_service import AgentService
from chat_addons.agent.services.llm_client import LLMClient

call_command("migrate", run_syncdb=True, verbosity=0)


class _SequencedProvider:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls: list[dict] = []

    def run(self, *, messages, tools, model, max_tokens):  # pragma: no cover - simple shim
        index = len(self.calls)
        self.calls.append({"messages": list(messages), "tools": tools, "model": model, "max_tokens": max_tokens})
        payload = self._responses[min(index, len(self._responses) - 1)]
        return payload


class AgentPolicyApiTests(APITestCase):
    def setUp(self) -> None:
        UserModel = get_user_model()
        self.operator, _ = UserModel.objects.get_or_create(
            username="policy-operator",
            defaults={
                "email": "policy@example.com",
                "supabase_uid": "policy-operator",
                "is_staff": True,
            },
        )

    def make_headers(self) -> dict[str, str]:
        token = jwt.encode(
            {"sub": self.operator.supabase_uid, "email": self.operator.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_policy_get_and_put_round_trip(self) -> None:
        url = reverse("agent-policy")
        response = self.client.get(url, {"cid": "messaging:policy-room"}, **self.make_headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["cid"], "messaging:policy-room")
        self.assertFalse(data["agent_enabled"])
        self.assertEqual(data["tool_hop_cap"], 2)
        self.assertEqual(data["turn_cap"], 6)
        self.assertEqual(data["auto_reply_mode"], AgentRoomPolicy.RECEPTIONIST)

        payload = {
            "cid": "messaging:policy-room",
            "agent_enabled": True,
            "enabled_skills": ["utility.calc", "utility.calc"],
            "tool_hop_cap": 3,
            "turn_cap": 4,
            "auto_reply_mode": AgentRoomPolicy.AUTO_REPLY_MANUAL,
            "handoff_message": "We'll get a teammate now.",
        }
        put_response = self.client.put(url, payload, format="json", **self.make_headers())
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        updated = put_response.json()
        self.assertEqual(updated["cid"], "messaging:policy-room")
        self.assertTrue(updated["agent_enabled"])
        self.assertEqual(updated["enabled_skills"], ["utility.calc"])
        self.assertEqual(updated["tool_hop_cap"], 3)
        self.assertEqual(updated["turn_cap"], 4)
        self.assertEqual(updated["auto_reply_mode"], AgentRoomPolicy.AUTO_REPLY_MANUAL)
        self.assertEqual(updated["handoff_message"], "We'll get a teammate now.")


class AgentOrchestratorTests(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        UserModel = get_user_model()
        cls.staff, _ = UserModel.objects.get_or_create(
            username="orchestrator-staff",
            defaults={
                "email": "staff@example.com",
                "supabase_uid": "orchestrator-staff",
                "is_staff": True,
            },
        )

    def setUp(self) -> None:
        Message.objects.all().delete()
        AgentRoomPolicy.objects.all().delete()
        AgentRun.objects.all().delete()

    def _service(self, responses) -> AgentService:
        client = LLMClient(provider=_SequencedProvider(responses))
        return AgentService(llm_client=client)

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_explicit_tool_call_path(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:calc-room",
            agent_enabled=True,
            enabled_skills=["utility.calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {
                "content": json.dumps(
                    {
                        "tool_calls": [
                            {"name": "utility.calc", "arguments": {"expr": "2*(3+4)"}}
                        ]
                    }
                ),
                "tokens_used": 5,
                "cost_usd": Decimal("0"),
            },
            {"content": "14", "tokens_used": 4, "cost_usd": Decimal("0.00001")},
        ]
        service = self._service(responses)

        reply = service.generate(cid="messaging:calc-room", user_id="user-1", text="2*(3+4)")

        self.assertEqual(reply.text, "14")
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(Message.objects.first().body, "14")
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

        run = AgentRun.objects.get()
        self.assertEqual(run.status, AgentRun.STATUS_OK)
        self.assertEqual(run.tools_used, ["utility.calc"])

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_fallback_path(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:fallback-room",
            agent_enabled=True,
            enabled_skills=["utility.calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {"content": "", "tokens_used": 3, "cost_usd": Decimal("0")},
            {"content": "14", "tokens_used": 2, "cost_usd": Decimal("0")},
        ]
        service = self._service(responses)

        reply = service.generate(cid="messaging:fallback-room", user_id="user-2", text="2*(3+4)")

        self.assertEqual(reply.text, "14")
        self.assertEqual(Message.objects.first().body, "14")
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

        run = AgentRun.objects.get()
        self.assertEqual(run.status, AgentRun.STATUS_OK)
        self.assertEqual(run.tools_used, ["utility.calc"])

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_cap_path_triggers_handoff(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:cap-room",
            agent_enabled=True,
            enabled_skills=["utility.calc"],
            tool_hop_cap=0,
            turn_cap=2,
            handoff_message="Let me connect you with a teammate.",
        )

        responses = [
            {
                "content": json.dumps(
                    {
                        "tool_calls": [
                            {"name": "utility.calc", "arguments": {"expr": "1+1"}}
                        ]
                    }
                ),
                "tokens_used": 2,
                "cost_usd": Decimal("0"),
            }
        ]
        service = self._service(responses)

        reply = service.generate(cid="messaging:cap-room", user_id="user-3", text="1+1")

        self.assertIn("teammate", reply.text)
        self.assertEqual(Message.objects.first().body, "Let me connect you with a teammate.")
        mock_broadcast.assert_called()
        mock_notify.assert_called()

        run = AgentRun.objects.get()
        self.assertEqual(run.status, AgentRun.STATUS_CAPPED)
        self.assertEqual(run.tools_used, [])
