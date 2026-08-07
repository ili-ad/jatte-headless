from __future__ import annotations

import json
from decimal import Decimal
from unittest import mock

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Message, Room
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, AgentRun
from stream_server_django.chat_addons.agent.services.agent_service import AgentService
from stream_server_django.chat_addons.agent.services.llm_client import LLMClient

class _SequencedProvider:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls: list[dict] = []

    def run(
        self, *, messages, tools, model, max_tokens, timeout=None
    ):  # pragma: no cover - simple shim
        index = len(self.calls)
        self.calls.append(
            {
                "messages": list(messages),
                "tools": tools,
                "model": model,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }
        )
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
        if not self.operator.is_staff:
            self.operator.is_staff = True
            self.operator.save(update_fields=["is_staff"])
        Room.objects.get_or_create(uuid="policy-room", defaults={"client": "stream"})

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
            "enabled_skills": ["utility_calc", "utility_calc"],
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
        self.assertEqual(updated["enabled_skills"], ["utility_calc"])
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
            enabled_skills=["utility_calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {
                "content": json.dumps(
                    {
                        "tool_calls": [
                            {"name": "utility_calc", "arguments": {"expr": "2*(3+4)"}}
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
        self.assertEqual(run.tools_used, ["utility_calc"])

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_structured_tool_calls_in_messages(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:structured-tool-room",
            agent_enabled=True,
            enabled_skills=["utility_calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {
                "content": "",
                "messages": [
                    {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "function": {
                                    "name": "utility_calc",
                                    "arguments": "{\"expr\":\"2*(3+4)\"}",
                                }
                            }
                        ],
                    }
                ],
                "tokens_used": 5,
                "cost_usd": Decimal("0"),
            },
            {"content": "14", "tokens_used": 4, "cost_usd": Decimal("0")},
        ]
        service = self._service(responses)

        reply = service.generate(
            cid="messaging:structured-tool-room", user_id="user-structured", text="2*(3+4)"
        )

        self.assertEqual(reply.text, "14")
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(Message.objects.first().body, "14")
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

        run = AgentRun.objects.get()
        self.assertEqual(run.status, AgentRun.STATUS_OK)
        self.assertIn("utility_calc", run.tools_used)

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_tool_messages_follow_assistant_calls(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:structured-tool-room",
            agent_enabled=True,
            enabled_skills=["utility_calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {
                "content": "",
                "messages": [
                    {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "id": "call_123",
                                "function": {
                                    "name": "utility_calc",
                                    "arguments": "{\"expr\":\"2*(3+4)\"}",
                                },
                            }
                        ],
                    }
                ],
                "tokens_used": 5,
                "cost_usd": Decimal("0"),
            },
            {"content": "14", "tokens_used": 4, "cost_usd": Decimal("0")},
        ]

        provider = _SequencedProvider(responses)
        service = AgentService(llm_client=LLMClient(provider=provider))

        reply = service.generate(
            cid="messaging:structured-tool-room", user_id="user-structured", text="2*(3+4)"
        )

        self.assertEqual(reply.text, "14")
        self.assertGreaterEqual(len(provider.calls), 2)
        second_call_messages = provider.calls[1]["messages"]

        self.assertGreaterEqual(len(second_call_messages), 2)
        for index, message in enumerate(second_call_messages):
            if message.get("role") != "tool":
                continue
            assistant_call_message = second_call_messages[index - 1]
            self.assertEqual(assistant_call_message.get("role"), "assistant")
            tool_ids = {
                tc.get("id")
                for tc in assistant_call_message.get("tool_calls", [])
                if isinstance(tc, dict)
            }
            self.assertIn(message.get("tool_call_id"), tool_ids)

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_fallback_path(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:fallback-room",
            agent_enabled=True,
            enabled_skills=["utility_calc"],
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
        self.assertEqual(run.tools_used, ["utility_calc"])

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_pre_router_single_candidate_executes_skill(
        self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock
    ) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:pre-route",
            agent_enabled=True,
            enabled_skills=["dummy_echo"],
            tool_hop_cap=2,
            turn_cap=2,
        )

        responses = [
            {"content": "Echoed!", "tokens_used": 3, "cost_usd": Decimal("0")},
        ]
        service = self._service(responses)

        reply = service.generate(
            cid="messaging:pre-route",
            user_id="user-pre",
            text="please echo this",
        )

        self.assertEqual(reply.text, "Echoed!")
        run = AgentRun.objects.get()
        self.assertEqual(run.tools_used, ["dummy_echo"])

        message = Message.objects.first()
        self.assertIsNotNone(message)
        agent_meta = message.custom_data.get("agent", {})
        self.assertEqual(agent_meta.get("routing_mode"), "pre_router")
        self.assertEqual(agent_meta.get("pre_routed_skill"), "dummy_echo")
        self.assertEqual(agent_meta.get("pre_router_candidate_count"), 1)

        provider_calls = service.llm_client.provider.calls
        self.assertEqual(len(provider_calls), 1)
        self.assertIsNone(provider_calls[0]["tools"])
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_pre_router_multiple_candidates_falls_back(
        self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock
    ) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:multi-route",
            agent_enabled=True,
            enabled_skills=["smalltalk_greet", "utility_time_now"],
            tool_hop_cap=2,
            turn_cap=2,
        )

        responses = [
            {"content": "Hello there!", "tokens_used": 3, "cost_usd": Decimal("0")},
        ]
        service = self._service(responses)

        reply = service.generate(
            cid="messaging:multi-route",
            user_id="user-multi",
            text="hello time",
        )

        self.assertEqual(reply.text, "Hello there!")
        message = Message.objects.first()
        self.assertIsNotNone(message)
        agent_meta = message.custom_data.get("agent", {})
        self.assertEqual(agent_meta.get("routing_mode"), "llm_router")
        self.assertEqual(agent_meta.get("pre_router_candidate_count"), 2)
        self.assertNotIn("pre_routed_skill", agent_meta)

        provider_calls = service.llm_client.provider.calls
        self.assertEqual(len(provider_calls), 1)
        self.assertIsNotNone(provider_calls[0]["tools"])
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_fallback_tool_messages_prefixed(self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:fallback-ordering-room",
            agent_enabled=True,
            enabled_skills=["utility_calc"],
            tool_hop_cap=2,
            turn_cap=4,
        )

        responses = [
            {"content": "", "tokens_used": 3, "cost_usd": Decimal("0")},
            {"content": "14", "tokens_used": 2, "cost_usd": Decimal("0")},
        ]

        provider = _SequencedProvider(responses)
        service = AgentService(llm_client=LLMClient(provider=provider))

        reply = service.generate(
            cid="messaging:fallback-ordering-room", user_id="user-2", text="2*(3+4)"
        )

        self.assertEqual(reply.text, "14")
        self.assertGreaterEqual(len(provider.calls), 2)
        second_call_messages = provider.calls[1]["messages"]

        for index, message in enumerate(second_call_messages):
            if message.get("role") != "tool":
                continue
            self.assertGreater(index, 0)
            assistant_message = second_call_messages[index - 1]
            self.assertEqual(assistant_message.get("role"), "assistant")
            tool_ids = {
                tc.get("id")
                for tc in assistant_message.get("tool_calls", [])
                if isinstance(tc, dict)
            }
            self.assertIn(message.get("tool_call_id"), tool_ids)

    @mock.patch("backend.chat_addons.agent.services.agent_service.NotificationService.create_notification_item")
    @mock.patch("backend.chat_addons.agent.services.agent_service._broadcast_to_cid")
    def test_cap_path_disables_tools_but_allows_final_synthesis(
        self, mock_broadcast: mock.MagicMock, mock_notify: mock.MagicMock
    ) -> None:
        AgentRoomPolicy.objects.create(
            cid="messaging:cap-room",
            agent_enabled=True,
            enabled_skills=["utility_calc"],
            tool_hop_cap=1,
            turn_cap=2,
            handoff_message="Let me connect you with a teammate.",
        )

        responses = [
            {
                "content": json.dumps(
                    {
                        "tool_calls": [
                            {"name": "utility_calc", "arguments": {"expr": "1+1"}}
                        ]
                    }
                ),
                "tokens_used": 2,
                "cost_usd": Decimal("0"),
            },
            {"content": "The answer is 2.", "tokens_used": 3, "cost_usd": Decimal("0")},
        ]
        provider = _SequencedProvider(responses)
        service = AgentService(llm_client=LLMClient(provider=provider))

        reply = service.generate(cid="messaging:cap-room", user_id="user-3", text="1+1")

        self.assertIn("2", reply.text)
        self.assertNotIn("teammate", reply.text)
        self.assertEqual(Message.objects.first().body, "The answer is 2.")
        mock_broadcast.assert_called()
        mock_notify.assert_not_called()

        self.assertGreaterEqual(len(provider.calls), 2)
        self.assertEqual(provider.calls[1]["tools"], [])

        run = AgentRun.objects.get()
        self.assertEqual(run.status, AgentRun.STATUS_OK)
        self.assertEqual(run.tools_used, ["utility_calc"])

    def test_orphan_tool_messages_are_sanitized(self) -> None:
        responses = [
            {"content": "ignored", "tokens_used": 1, "cost_usd": Decimal("0")}
        ]

        provider = _SequencedProvider(responses)
        service = AgentService(llm_client=LLMClient(provider=provider))

        messages = [
            {"role": "tool", "content": "dangling"},
            {"role": "user", "content": "hi"},
        ]

        with self.assertLogs("agent", level="WARNING") as logs:
            service._call_llm(messages, [], {"cid": "messaging:orphan"})

        self.assertEqual(len(provider.calls), 1)
        sent_messages = provider.calls[0]["messages"]
        self.assertTrue(all(msg.get("role") != "tool" for msg in sent_messages))
        self.assertTrue(any("orphaned_message_dropped" in record.getMessage() for record in logs.records))
