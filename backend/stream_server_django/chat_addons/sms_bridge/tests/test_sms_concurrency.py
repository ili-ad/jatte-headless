from __future__ import annotations

import json
import threading
from unittest.mock import patch

from django.db import connection, close_old_connections
from django.test import TransactionTestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.sms_bridge.auth import sms_provider_signature
from stream_server_django.chat_addons.sms_bridge.models import SmsRelay


@override_settings(
    ROOT_URLCONF="stream_server_django.chat_addons.sms_bridge.urls",
    SMS_WEBHOOK_SECRET="concurrency-secret",
)
class SmsDatabaseConcurrencyTests(TransactionTestCase):
    databases = {"default"}
    reset_sequences = True

    def setUp(self) -> None:
        if connection.vendor != "postgresql":
            self.skipTest("row-lock concurrency proof requires PostgreSQL")

    def _concurrent_posts(self, url: str, payload: dict[str, object]) -> list[int]:
        body = json.dumps(payload).encode("utf-8")
        signature = sms_provider_signature("concurrency-secret", body)
        ready = threading.Barrier(2)
        statuses: list[int] = []
        errors: list[BaseException] = []
        guard = threading.Lock()

        def worker() -> None:
            close_old_connections()
            try:
                client = APIClient()
                ready.wait(timeout=5)
                response = client.post(
                    url,
                    body,
                    content_type="application/json",
                    HTTP_X_SIGNATURE=signature,
                )
                with guard:
                    statuses.append(response.status_code)
            except BaseException as exc:  # pragma: no cover - diagnostic path
                with guard:
                    errors.append(exc)
            finally:
                close_old_connections()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=10)
        self.assertFalse(any(thread.is_alive() for thread in threads))
        self.assertEqual(errors, [])
        return sorted(statuses)

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    def test_simultaneous_inbound_delivery_executes_once(self, broadcast) -> None:
        payload = {
            "from": "+15551230000",
            "to": "+15559870000",
            "text": "Concurrent inbound",
            "external_id": "concurrent-inbound-1",
            "event": "message",
        }

        statuses = self._concurrent_posts(reverse("sms-inbound-webhook"), payload)

        self.assertEqual(statuses, [200, 409])
        self.assertEqual(
            SmsRelay.objects.filter(
                direction=SmsRelay.DIRECTION_INBOUND,
                external_id="concurrent-inbound-1",
            ).count(),
            1,
        )
        self.assertEqual(Message.objects.filter(body="Concurrent inbound").count(), 1)
        broadcast.assert_called_once()

    @patch(
        "stream_server_django.chat_addons.sms_bridge.views.broadcast_message_update"
    )
    def test_simultaneous_receipts_transition_and_broadcast_once(self, broadcast) -> None:
        channel = Channel.objects.create(uuid="concurrent-receipt", client="sms")
        room = Room.objects.create(uuid="concurrent-receipt", client="sms")
        message = Message.objects.create(
            channel=channel,
            body="pending receipt",
            sent_by="sms",
            custom_data={"delivery_status": SmsRelay.STATUS_PENDING},
        )
        room.messages.add(message)
        relay = SmsRelay.objects.create(
            cid="messaging:concurrent-receipt",
            direction=SmsRelay.DIRECTION_OUTBOUND,
            external_id="concurrent-receipt-1",
            status=SmsRelay.STATUS_PENDING,
            message_id=str(message.id),
        )

        statuses = self._concurrent_posts(
            reverse("sms-delivery-receipt"),
            {"external_id": relay.external_id, "status": SmsRelay.STATUS_DELIVERED},
        )

        self.assertEqual(statuses, [200, 409])
        relay.refresh_from_db()
        message.refresh_from_db()
        self.assertEqual(relay.status, SmsRelay.STATUS_DELIVERED)
        self.assertEqual(
            message.custom_data.get("delivery_status"), SmsRelay.STATUS_DELIVERED
        )
        broadcast.assert_called_once()
