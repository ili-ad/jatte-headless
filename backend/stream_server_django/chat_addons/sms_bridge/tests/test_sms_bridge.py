from __future__ import annotations

import base64
import hmac
import json
from hashlib import sha256
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Channel, Message, Room
User = get_user_model()

from stream_server_django.chat_addons.sms_bridge.models import SmsConsent, SmsRelay, SmsRoomLink
from stream_server_django.chat_addons.sms_bridge.services.consent import (
    is_opted_out,
    start_confirmation_text,
    stop_confirmation_text,
)
from stream_server_django.chat_addons.sms_bridge.services.provider import SmsProviderResponse


def make_signature(secret: str, payload: dict[str, object]) -> str:
    body = json.dumps(payload).encode("utf-8")
    encoded = base64.b64encode(body)
    return hmac.new(secret.encode("utf-8"), encoded, sha256).hexdigest()


@override_settings(ROOT_URLCONF="jatte.urls", SMS_WEBHOOK_SECRET="super-secret")
class SmsBridgeWebhookTests(APITestCase):
    def setUp(self) -> None:
        self.payload = {
            "from": "+15551230000",
            "to": "+15559870000",
            "text": "Hello from SMS",
            "external_id": "ext-1",
            "event": "message",
        }
        self.url = reverse("sms-inbound-webhook")

    def post_payload(self, payload: dict[str, object], signature: str):
        body = json.dumps(payload)
        return self.client.post(
            self.url,
            data=body,
            content_type="application/json",
            HTTP_X_SIGNATURE=signature,
        )

    def test_invalid_signature_rejected(self) -> None:
        response = self.post_payload(self.payload, signature="bad")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Message.objects.count(), 0)

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    def test_valid_webhook_creates_message(self, mocked_broadcast) -> None:
        signature = make_signature("super-secret", self.payload)
        response = self.post_payload(self.payload, signature)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

        message = Message.objects.order_by("-id").first()
        self.assertIsNotNone(message)
        if message:
            self.assertEqual(message.body, "Hello from SMS")
            self.assertEqual(message.custom_data.get("delivery_status"), SmsRelay.STATUS_DELIVERED)

        relay = SmsRelay.objects.get()
        self.assertEqual(relay.direction, SmsRelay.DIRECTION_INBOUND)
        self.assertEqual(relay.status, SmsRelay.STATUS_DELIVERED)

        link = SmsRoomLink.objects.get()
        self.assertEqual(link.phone_e164, "+15551230000")
        mocked_broadcast.assert_called_once()

    def test_duplicate_external_id_is_rejected_as_replay(self) -> None:
        signature = make_signature("super-secret", self.payload)
        first = self.post_payload(self.payload, signature)
        self.assertEqual(first.status_code, 200)
        second = self.post_payload(self.payload, signature)
        self.assertEqual(second.status_code, 409)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(SmsRelay.objects.count(), 1)

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551230000"])
    @patch(
        "stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay"
    )
    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("stream_server_django.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_stop_creates_consent_and_confirmation(
        self,
        mocked_send,
        mocked_broadcast,
        mocked_delay,
    ) -> None:
        payload = dict(self.payload)
        payload["text"] = "STOP"
        payload["external_id"] = "ext-stop"
        mocked_send.return_value = SmsProviderResponse(external_id="ext-stop-confirm")

        signature = make_signature("super-secret", payload)
        response = self.post_payload(payload, signature)

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["handled"], "stop")

        consent = SmsConsent.objects.get(phone_e164="+15551230000")
        self.assertTrue(is_opted_out(consent.phone_e164))
        mocked_send.assert_called_once_with("+15551230000", stop_confirmation_text())
        mocked_delay.assert_not_called()
        self.assertTrue(
            Message.objects.filter(
                custom_data__source="sms_system",
                custom_data__sms_consent_event="stop",
            ).exists()
        )

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551230000"])
    @patch(
        "stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay"
    )
    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("stream_server_django.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_opted_out_blocks_autoreply(
        self,
        mocked_send,
        mocked_broadcast,
        mocked_delay,
    ) -> None:
        stop_payload = dict(self.payload)
        stop_payload["text"] = "STOP"
        stop_payload["external_id"] = "ext-stop"
        mocked_send.return_value = SmsProviderResponse(external_id="ext-stop-confirm")
        signature = make_signature("super-secret", stop_payload)
        response = self.post_payload(stop_payload, signature)
        self.assertEqual(response.status_code, 200)
        mocked_delay.assert_not_called()
        mocked_delay.reset_mock()

        hello_payload = dict(self.payload)
        hello_payload["text"] = "hello"
        hello_payload["external_id"] = "ext-hello"
        signature = make_signature("super-secret", hello_payload)
        response = self.post_payload(hello_payload, signature)
        self.assertEqual(response.status_code, 200)
        mocked_delay.assert_not_called()

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551230000"])
    @patch(
        "stream_server_django.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay"
    )
    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("stream_server_django.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_start_clears_opt_out_and_allows_autoreply(
        self,
        mocked_send,
        mocked_broadcast,
        mocked_delay,
    ) -> None:
        stop_payload = dict(self.payload)
        stop_payload["text"] = "STOP"
        stop_payload["external_id"] = "ext-stop"

        start_payload = dict(self.payload)
        start_payload["text"] = "START"
        start_payload["external_id"] = "ext-start"

        mocked_send.side_effect = [
            SmsProviderResponse(external_id="ext-stop-confirm"),
            SmsProviderResponse(external_id="ext-start-confirm"),
        ]

        signature = make_signature("super-secret", stop_payload)
        response = self.post_payload(stop_payload, signature)
        self.assertEqual(response.status_code, 200)
        signature = make_signature("super-secret", start_payload)
        response = self.post_payload(start_payload, signature)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(is_opted_out("+15551230000"))
        mocked_send.assert_called_with("+15551230000", start_confirmation_text())
        self.assertTrue(
            Message.objects.filter(
                custom_data__source="sms_system",
                custom_data__sms_consent_event="start",
            ).exists()
        )

        mocked_delay.reset_mock()
        hello_payload = dict(self.payload)
        hello_payload["text"] = "hello"
        hello_payload["external_id"] = "ext-hello"
        signature = make_signature("super-secret", hello_payload)
        response = self.post_payload(hello_payload, signature)
        self.assertEqual(response.status_code, 200)
        mocked_delay.assert_called_once()


@override_settings(ROOT_URLCONF="jatte.urls", SMS_WEBHOOK_SECRET="super-secret")
class SmsBridgeSendTests(APITestCase):
    def setUp(self) -> None:
        self.agent = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="secret",
            supabase_uid="admin-uid",
        )
        self.agent.is_staff = True
        self.agent.save(update_fields=["is_staff"])
        self.url = reverse("sms-send")

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("stream_server_django.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_send_creates_pending_message(self, mocked_send, mocked_broadcast) -> None:
        mocked_send.return_value = SmsProviderResponse(external_id="ext-2")
        self.client.force_authenticate(user=self.agent)

        payload = {"cid": "messaging:room-1", "to": "+15551231234", "text": "Reply"}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 202)
        body = response.json()
        self.assertIn("run_id", body)
        self.assertEqual(body["status"], "queued")

        message = Message.objects.order_by("-id").first()
        self.assertIsNotNone(message)
        if message:
            self.assertEqual(message.custom_data.get("delivery_status"), SmsRelay.STATUS_PENDING)
            self.assertEqual(message.sent_by, "admin-uid")

        relay = SmsRelay.objects.get()
        self.assertEqual(relay.direction, SmsRelay.DIRECTION_OUTBOUND)
        self.assertEqual(relay.status, SmsRelay.STATUS_PENDING)
        self.assertEqual(relay.external_id, "ext-2")
        mocked_broadcast.assert_called_once()

    def test_non_staff_denied(self) -> None:
        payload = {"cid": "messaging:room-2", "to": "+15551239999", "text": "Hi"}
        non_staff = User.objects.create_user(
            username="member",
            email="member@example.com",
            password="secret",
            supabase_uid="member-uid",
        )
        self.client.force_authenticate(user=non_staff)

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 403)


@override_settings(ROOT_URLCONF="jatte.urls", SMS_WEBHOOK_SECRET="super-secret")
class SmsBridgeReceiptTests(APITestCase):
    def setUp(self) -> None:
        room_uuid = "receipt-room"
        self.cid = f"messaging:{room_uuid}"
        channel = Channel.objects.create(uuid=room_uuid, client="sms")
        room = Room.objects.create(uuid=room_uuid, client="sms")
        self.message = Message.objects.create(
            channel=channel,
            body="pending",
            sent_by="admin-uid",
            custom_data={"delivery_status": SmsRelay.STATUS_PENDING},
        )
        room.messages.add(self.message)
        self.relay = SmsRelay.objects.create(
            cid=self.cid,
            direction=SmsRelay.DIRECTION_OUTBOUND,
            external_id="ext-receipt",
            status=SmsRelay.STATUS_PENDING,
            message_id=str(self.message.id),
        )
        self.url = reverse("sms-delivery-receipt")

    @patch(
        "stream_server_django.chat_addons.sms_bridge.views.broadcast_message_update"
    )
    def test_receipt_updates_message(self, mocked_broadcast) -> None:
        payload = {"external_id": "ext-receipt", "status": "delivered", "error_code": None}
        response = self.post_signed(payload)

        self.assertEqual(response.status_code, 200)
        self.relay.refresh_from_db()
        self.assertEqual(self.relay.status, SmsRelay.STATUS_DELIVERED)
        self.message.refresh_from_db()
        self.assertEqual(self.message.custom_data.get("delivery_status"), "delivered")
        mocked_broadcast.assert_called_once_with(self.message)

    def post_signed(self, payload: dict[str, object]):
        body = json.dumps(payload)
        return self.client.post(
            self.url,
            body,
            content_type="application/json",
            HTTP_X_SIGNATURE=make_signature("super-secret", payload),
        )
