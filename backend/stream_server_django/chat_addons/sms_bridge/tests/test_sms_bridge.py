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

from stream_server_django.chat_addons.sms_bridge.models import SmsRelay, SmsRoomLink
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

    @patch("backend.chat_addons.sms_bridge.views._broadcast_to_cid")
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

    def test_duplicate_external_id_noop(self) -> None:
        signature = make_signature("super-secret", self.payload)
        first = self.post_payload(self.payload, signature)
        self.assertEqual(first.status_code, 200)
        second = self.post_payload(self.payload, signature)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(SmsRelay.objects.count(), 1)


@override_settings(ROOT_URLCONF="jatte.urls", SMS_WEBHOOK_SECRET="super-secret")
class SmsBridgeSendTests(APITestCase):
    def setUp(self) -> None:
        self.agent = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="secret",
            supabase_uid="admin-uid",
        )
        self.url = reverse("sms-send")

    @patch("backend.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("backend.chat_addons.sms_bridge.views.SmsProviderClient.send")
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

    @patch("backend.chat_addons.sms_bridge.views.broadcast_message_update")
    def test_receipt_updates_message(self, mocked_broadcast) -> None:
        payload = {"external_id": "ext-receipt", "status": "delivered", "error_code": None}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.relay.refresh_from_db()
        self.assertEqual(self.relay.status, SmsRelay.STATUS_DELIVERED)
        self.message.refresh_from_db()
        self.assertEqual(self.message.custom_data.get("delivery_status"), "delivered")
        mocked_broadcast.assert_called_once_with(self.message)
