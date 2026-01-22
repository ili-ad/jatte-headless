from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.test import TestCase, override_settings

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.agent.services.agent_service import AgentReply
from stream_server_django.chat_addons.sms_bridge.models import SmsRelay
from stream_server_django.chat_addons.sms_bridge.services.autoreply import (
    maybe_enqueue_sms_autoreply,
)
from stream_server_django.chat_addons.sms_bridge.services.provider import SmsProviderResponse
from stream_server_django.chat_addons.sms_bridge.tasks import sms_autoreply_task


class SmsAutoreplyEnqueueTests(TestCase):
    def setUp(self) -> None:
        cache.clear()
        self.room = Room.objects.create(uuid="sms-room", client="sms")
        self.channel = Channel.objects.create(uuid="sms-room", client="sms")
        self.message = Message.objects.create(
            channel=self.channel,
            body="Hello from SMS",
            sent_by="sms-user",
            custom_data={},
        )
        self.room.messages.add(self.message)

    @override_settings(SMS_IRIS_AUTOREPLY_ENABLED=False)
    @patch("stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    def test_flag_off_skips_enqueue(self, mocked_delay) -> None:
        decision = maybe_enqueue_sms_autoreply(
            room=self.room,
            triggering_message=self.message,
            sender_e164="+15551231234",
        )

        self.assertFalse(decision.allowed)
        self.assertEqual(decision.reason, "disabled")
        mocked_delay.assert_not_called()

    @override_settings(
        SMS_IRIS_AUTOREPLY_ENABLED=True,
        SMS_IRIS_AUTOREPLY_ALLOWLIST=["+15550001111"],
    )
    @patch("stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    def test_allowlist_required(self, mocked_delay) -> None:
        decision = maybe_enqueue_sms_autoreply(
            room=self.room,
            triggering_message=self.message,
            sender_e164="+15551231234",
        )

        self.assertFalse(decision.allowed)
        self.assertEqual(decision.reason, "not_allowlisted")
        mocked_delay.assert_not_called()

    @override_settings(
        SMS_IRIS_AUTOREPLY_ENABLED=True,
        SMS_IRIS_AUTOREPLY_ALLOWLIST=["+15551231234"],
        SMS_IRIS_AUTOREPLY_MAX_PER_HOUR=1,
    )
    @patch("stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    def test_rate_limit_skips_after_threshold(self, mocked_delay) -> None:
        first = maybe_enqueue_sms_autoreply(
            room=self.room,
            triggering_message=self.message,
            sender_e164="+15551231234",
        )

        second_message = Message.objects.create(
            channel=self.channel,
            body="Another message",
            sent_by="sms-user",
            custom_data={},
        )
        self.room.messages.add(second_message)

        second = maybe_enqueue_sms_autoreply(
            room=self.room,
            triggering_message=second_message,
            sender_e164="+15551231234",
        )

        self.assertTrue(first.allowed)
        self.assertEqual(first.reason, "enqueued")
        self.assertFalse(second.allowed)
        self.assertEqual(second.reason, "rate_limited")
        mocked_delay.assert_called_once()

    @override_settings(
        SMS_IRIS_AUTOREPLY_ENABLED=True,
        SMS_IRIS_AUTOREPLY_ALLOWLIST=["+15551231234"],
    )
    @patch("stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    def test_autoreply_messages_are_ignored(self, mocked_delay) -> None:
        self.message.custom_data = {"source": "sms_autoreply"}
        self.message.save(update_fields=["custom_data"])

        decision = maybe_enqueue_sms_autoreply(
            room=self.room,
            triggering_message=self.message,
            sender_e164="+15551231234",
        )

        self.assertFalse(decision.allowed)
        self.assertEqual(decision.reason, "autoreply_message")
        mocked_delay.assert_not_called()


class SmsAutoreplyTaskTests(TestCase):
    def setUp(self) -> None:
        self.room = Room.objects.create(uuid="sms-room", client="sms")
        self.channel = Channel.objects.create(uuid="sms-room", client="sms")
        self.triggering_message = Message.objects.create(
            channel=self.channel,
            body="Hello from SMS",
            sent_by="sms-user",
            custom_data={},
        )
        self.room.messages.add(self.triggering_message)
        self.assistant_message = Message.objects.create(
            channel=self.channel,
            body="",
            sent_by="ai-bot-sms-room",
            custom_data={"ai_generated": True},
        )
        self.room.messages.add(self.assistant_message)

    @patch("stream_server_django.chat_addons.sms_bridge.tasks.broadcast_message_update")
    @patch("stream_server_django.chat_addons.sms_bridge.tasks.SmsProviderClient.send")
    @patch("stream_server_django.chat_addons.sms_bridge.tasks.get_agent_service")
    def test_task_persists_and_sends(
        self,
        mocked_get_service: MagicMock,
        mocked_send: MagicMock,
        mocked_broadcast: MagicMock,
    ) -> None:
        mocked_send.return_value = SmsProviderResponse(external_id="sms-ext-1")
        mocked_get_service.return_value.generate.return_value = AgentReply(
            text="**Hello** [friend](https://example.com)",
            tokens_used=1,
            latency_ms=1,
            model="stub",
            cost_usd=Decimal("0"),
            reason="ok",
            messages=[self.assistant_message],
        )

        sms_autoreply_task(
            room_id=str(self.room.id),
            triggering_message_id=str(self.triggering_message.id),
            sender_e164="+15551231234",
        )

        self.assistant_message.refresh_from_db()
        self.triggering_message.refresh_from_db()

        self.assertEqual(self.assistant_message.body, "Hello friend")
        self.assertEqual(self.assistant_message.custom_data["source"], "sms_autoreply")
        self.assertEqual(
            self.assistant_message.custom_data["in_reply_to"],
            str(self.triggering_message.id),
        )
        self.assertTrue(self.assistant_message.custom_data["autogen"])
        mocked_broadcast.assert_called_once_with(self.assistant_message)

        relay = SmsRelay.objects.get(direction=SmsRelay.DIRECTION_OUTBOUND)
        self.assertEqual(relay.message_id, str(self.assistant_message.id))
        self.assertEqual(relay.external_id, "sms-ext-1")

        sms_meta = self.triggering_message.custom_data["sms_autoreply"]
        self.assertEqual(sms_meta["status"], "sent")
        self.assertEqual(sms_meta["reply_message_id"], str(self.assistant_message.id))
