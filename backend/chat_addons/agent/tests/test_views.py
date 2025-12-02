from __future__ import annotations

from unittest import mock

import os
import sys
import time
from pathlib import Path
from decimal import Decimal

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
from chat.models import Channel, Message, Room
from chat_addons.agent.models import AgentRun, RoomAgentFlag
from chat_addons.agent.services.agent_service import AgentSimulationResult
from chat_addons.agent.services.memory import MemoryService
from chat_addons.agent.utils import agent_user_id_for_room


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

    @mock.patch("chat_addons.agent.tasks._broadcast_to_cid")
    @mock.patch("chat_addons.agent.tasks.get_agent_service")
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

        messages = Message.objects.filter(
            channel__uuid="invoke-room",
            sent_by=agent_user_id_for_room("invoke-room"),
        )
        self.assertEqual(messages.count(), 1)
        self.assertEqual(messages.first().body, "pong")
        mock_broadcast.assert_called()

    def test_rag_invocation_persists_agent_reply(self) -> None:
        room = Room.objects.create(uuid="rag-room", client="stream")
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        RoomAgentFlag.objects.create(room=room, agent_enabled=True)

        user_message = Message.objects.create(channel=channel, body="Hello", sent_by="u-1")

        url = reverse("agent-rag")
        response = self.client.post(
            url,
            {
                "room_uuid": "messaging:rag-room",
                "last_human_message_id": user_message.id,
            },
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertIn("messages", payload)
        messages = payload["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["user_id"], agent_user_id_for_room("rag-room"))

        agent_messages = Message.objects.filter(
            channel__uuid="rag-room", sent_by=agent_user_id_for_room("rag-room")
        )
        self.assertEqual(agent_messages.count(), 1)

    @mock.patch("chat_addons.agent.views.get_agent_service")
    def test_llm_invoke_enqueues_job_and_returns_queued_status(
        self, mock_get_service: mock.MagicMock
    ) -> None:
        room = Room.objects.create(uuid="llm-room", client="stream")
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        RoomAgentFlag.objects.create(room=room, agent_enabled=True)

        user_message = Message.objects.create(
            channel=channel, body="Hello", sent_by="user-1"
        )

        service = mock.Mock()
        service.enqueue_generate.return_value = "job-123"
        mock_get_service.return_value = service

        response = self.client.post(
            reverse("agent-invoke", kwargs={"cid": f"messaging:{room.uuid}"}),
            {
                "room_uuid": room.uuid,
                "last_human_message_id": user_message.id,
                "trace_id": "trace-1",
            },
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        payload = response.json()
        self.assertEqual(payload["status"], "queued")
        self.assertEqual(payload["job_id"], "job-123")
        self.assertEqual(payload["trace_id"], "trace-1")

        service.enqueue_generate.assert_called_once()
        _, kwargs = service.enqueue_generate.call_args
        self.assertEqual(kwargs["cid"], f"messaging:{room.uuid}")
        self.assertEqual(kwargs["user_id"], str(self.operator.id))
        self.assertEqual(kwargs["text"], user_message.body)
        self.assertEqual(kwargs["request_id"], "trace-1")
        self.assertEqual(kwargs["meta"].get("job_request_id"), "trace-1")
        self.assertEqual(kwargs["meta"].get("job_id"), "job-123")

    @mock.patch("chat_addons.agent.views.get_agent_service")
    def test_llm_invoke_returns_500_when_enqueue_fails(
        self, mock_get_service: mock.MagicMock
    ) -> None:
        room = Room.objects.create(uuid="llm-timeout", client="stream")
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        RoomAgentFlag.objects.create(room=room, agent_enabled=True)

        user_message = Message.objects.create(
            channel=channel, body="Hello", sent_by="user-1"
        )

        service = mock.Mock()
        service.enqueue_generate.side_effect = RuntimeError("enqueue failed")
        mock_get_service.return_value = service

        response = self.client.post(
            reverse("agent-invoke", kwargs={"cid": f"messaging:{room.uuid}"}),
            {
                "room_uuid": room.uuid,
                "last_human_message_id": user_message.id,
            },
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        payload = response.json()
        self.assertIn("Agent invocation failed", payload["detail"])

    def test_list_runs_with_pagination(self) -> None:
        AgentRun.objects.create(
            run_id="r-1",
            cid="messaging:test-room",
            user_id="user",
            tools_used=["utility.calc"],
            status=AgentRun.STATUS_OK,
            latency_ms=101,
            tokens_in=21,
            tokens_out=11,
            cost_usd=Decimal("0.0011"),
        )
        AgentRun.objects.create(
            run_id="r-2",
            cid="messaging:test-room",
            user_id="user",
            tools_used=["utility.calc"],
            status=AgentRun.STATUS_HANDOFF,
            latency_ms=102,
            tokens_in=22,
            tokens_out=12,
            cost_usd=Decimal("0.0012"),
        )
        AgentRun.objects.create(
            run_id="r-3",
            cid="messaging:test-room",
            user_id="user",
            tools_used=["utility.calc"],
            status=AgentRun.STATUS_ERROR,
            latency_ms=103,
            tokens_in=23,
            tokens_out=13,
            cost_usd=Decimal("0.0013"),
        )

        url = reverse("agent-runs") + "?cid=messaging:test-room&limit=2"
        response = self.client.get(url, **self.auth_headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 2)
        self.assertIsNotNone(payload["next"])
        self.assertEqual(payload["results"][0]["run_id"], "r-3")
        self.assertEqual(payload["results"][0]["status"], AgentRun.STATUS_ERROR)
        self.assertEqual(payload["results"][0]["tokens_in"], 23)
        self.assertIsInstance(payload["results"][0]["cost_usd"], float)

        next_cursor = payload["next"]
        next_url = reverse("agent-runs") + f"?cid=messaging:test-room&cursor={next_cursor}"
        next_response = self.client.get(next_url, **self.auth_headers())
        self.assertEqual(next_response.status_code, status.HTTP_200_OK)
        next_payload = next_response.json()
        self.assertEqual(len(next_payload["results"]), 1)
        self.assertIsNone(next_payload["next"])
        self.assertEqual(next_payload["results"][0]["run_id"], "r-1")

    def test_memory_list_endpoint(self) -> None:
        service = MemoryService(max_lines=6)
        for idx in range(4):
            service.add_line(
                cid="messaging:memory-room",
                role="human",
                text=f"memory {idx}",
            )

        url = reverse("agent-memory") + "?cid=messaging:memory-room&limit=2"
        response = self.client.get(url, **self.auth_headers())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual([item["text"] for item in payload["results"]], ["memory 3", "memory 2"])
        self.assertIsNotNone(payload["next"])

        next_url = reverse("agent-memory") + f"?cid=messaging:memory-room&cursor={payload['next']}"
        next_response = self.client.get(next_url, **self.auth_headers())
        self.assertEqual(next_response.status_code, status.HTTP_200_OK)
        next_payload = next_response.json()
        self.assertEqual([item["text"] for item in next_payload["results"]], ["memory 1", "memory 0"])
        self.assertIsNone(next_payload["next"])

    @mock.patch("chat_addons.agent.views.get_agent_service")
    def test_simulate_invokes_service_without_messages(
        self, mock_get_service: mock.MagicMock
    ) -> None:
        service = mock.Mock()
        service.simulate.return_value = AgentSimulationResult(
            reply="It's 14.",
            status="ok",
            tools_used=["utility.calc"],
            latency_ms=115,
            tokens_in=200,
            tokens_out=40,
            cost_usd=Decimal("0.0020"),
            model="test-model",
        )
        mock_get_service.return_value = service

        before_count = Message.objects.count()

        response = self.client.post(
            reverse("agent-simulate"),
            {"cid": "messaging:sim-room", "prompt": "2*(3+4)"},
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload["reply"], "It's 14.")
        self.assertEqual(payload["tools_used"], ["utility.calc"])
        self.assertEqual(payload["tokens_in"], 200)
        self.assertEqual(payload["tokens_out"], 40)
        self.assertAlmostEqual(payload["cost_usd"], 0.002)
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(Message.objects.count(), before_count)

        service.simulate.assert_called_once_with(
            cid="messaging:sim-room", prompt="2*(3+4)", meta={}
        )
