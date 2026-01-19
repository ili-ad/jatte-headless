from __future__ import annotations

import base64
import hmac
import json
from hashlib import sha256
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Message
from stream_server_django.chat_addons.sms_bridge.models import SmsConsent
from stream_server_django.chat_addons.sms_bridge.services.consent import (
    is_opted_out,
    parse_control_word,
    start_confirmation_text,
    stop_confirmation_text,
)
from stream_server_django.chat_addons.sms_bridge.services.provider import SmsProviderResponse


def make_signature(secret: str, payload: dict[str, object]) -> str:
    body = json.dumps(payload).encode("utf-8")
    encoded = base64.b64encode(body)
    return hmac.new(secret.encode("utf-8"), encoded, sha256).hexdigest()


@override_settings(ROOT_URLCONF="jatte.urls", SMS_WEBHOOK_SECRET="super-secret")
class SmsConsentWebhookTests(APITestCase):
    def setUp(self) -> None:
        self.payload = {
            "from": "+15551231234",
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

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551231234"])
    @patch("backend.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    @patch("backend.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("backend.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_stop_opts_out_sends_confirmation_and_skips_autoreply(
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
        self.assertTrue(response.json()["ok"])
        self.assertEqual(response.json()["handled"], "stop")
        self.assertTrue(is_opted_out("+15551231234"))

        mocked_send.assert_called_once_with("+15551231234", stop_confirmation_text())
        mocked_delay.assert_not_called()
        self.assertTrue(
            Message.objects.filter(
                custom_data__source="sms_system",
                custom_data__sms_consent_event="stop",
            ).exists()
        )
        self.assertTrue(SmsConsent.objects.filter(phone_e164="+15551231234").exists())

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551231234"])
    @patch("backend.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    @patch("backend.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("backend.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_start_opts_in_sends_confirmation_and_skips_autoreply(
        self,
        mocked_send,
        mocked_broadcast,
        mocked_delay,
    ) -> None:
        payload = dict(self.payload)
        payload["text"] = "START"
        payload["external_id"] = "ext-start"
        mocked_send.return_value = SmsProviderResponse(external_id="ext-start-confirm")

        signature = make_signature("super-secret", payload)
        response = self.post_payload(payload, signature)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(response.json()["handled"], "start")
        self.assertFalse(is_opted_out("+15551231234"))

        mocked_send.assert_called_once_with("+15551231234", start_confirmation_text())
        mocked_delay.assert_not_called()
        self.assertTrue(
            Message.objects.filter(
                custom_data__source="sms_system",
                custom_data__sms_consent_event="start",
            ).exists()
        )

    @override_settings(SMS_AUTOREPLY_ENABLED=True, SMS_AUTOREPLY_ALLOWLIST=["+15551231234"])
    @patch("backend.chat_addons.sms_bridge.services.autoreply.sms_autoreply_task.delay")
    @patch("backend.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("backend.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_opted_out_sender_never_enqueues_autoreply(
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


class SmsConsentParsingTests(TestCase):
    def test_parse_control_word_variants(self) -> None:
        self.assertEqual(parse_control_word(" STOP!! "), "stop")
        self.assertEqual(parse_control_word("unsubSCRIBE"), "stop")
        self.assertEqual(parse_control_word("Start."), "start")
