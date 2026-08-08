import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat_addons.sms_bridge.auth import sms_provider_signature
from stream_server_django.chat_addons.sms_bridge.models import SmsRelay
from stream_server_django.chat_addons.sms_bridge.services.provider import (
    SmsProviderResponse,
)
from jatte.tests.jwt_factory import make_test_token


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat_addons.tests.pr5_urls",
    CHAT_INTERNAL_SERVICE_TOKEN="service-secret",
    SMS_WEBHOOK_SECRET="webhook-secret",
)
class SmsAuthorizationTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="sms-member", supabase_uid="sms-member"
        )
        self.staff = User.objects.create_user(
            username="sms-staff", supabase_uid="sms-staff", is_staff=True
        )
        self.webhook_url = reverse("sms-inbound-webhook")
        self.receipt_url = reverse("sms-delivery-receipt")
        self.send_url = reverse("sms-send")
        self.webhook_payload = {
            "from": "+15551230000",
            "to": "+15559870000",
            "text": "Hello",
            "external_id": "provider-event-1",
            "event": "message",
        }

    def jwt_auth(self, user) -> dict[str, str]:
        token = make_test_token(user.supabase_uid, email=user.email)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def signed_post(self, url, payload):
        body = json.dumps(payload).encode("utf-8")
        return self.client.post(
            url,
            body,
            content_type="application/json",
            HTTP_X_SIGNATURE=sms_provider_signature("webhook-secret", body),
        )

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    def test_webhook_requires_exact_signature_and_rejects_replay(self, broadcast):
        missing = self.client.post(
            self.webhook_url, self.webhook_payload, format="json"
        )
        invalid = self.client.post(
            self.webhook_url,
            self.webhook_payload,
            format="json",
            HTTP_X_SIGNATURE="invalid",
        )

        original_body = json.dumps(self.webhook_payload).encode("utf-8")
        modified = dict(self.webhook_payload, text="modified")
        modified_body = json.dumps(modified).encode("utf-8")
        modified_response = self.client.post(
            self.webhook_url,
            modified_body,
            content_type="application/json",
            HTTP_X_SIGNATURE=sms_provider_signature(
                "webhook-secret", original_body
            ),
        )
        browser_only = self.client.post(
            self.webhook_url,
            self.webhook_payload,
            format="json",
            **self.jwt_auth(self.staff),
        )

        valid = self.signed_post(self.webhook_url, self.webhook_payload)
        replay = self.signed_post(self.webhook_url, self.webhook_payload)

        for response in (missing, invalid, modified_response, browser_only):
            self.assertEqual(response.status_code, 403)
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(replay.status_code, 409)
        self.assertEqual(SmsRelay.objects.filter(direction="inbound").count(), 1)
        broadcast.assert_called_once()

    @override_settings(SMS_WEBHOOK_SECRET="")
    def test_missing_webhook_secret_fails_closed(self):
        response = self.client.post(
            self.webhook_url, self.webhook_payload, format="json"
        )
        self.assertEqual(response.status_code, 503)

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    def test_receipt_requires_provider_signature_or_service_token(self, broadcast):
        SmsRelay.objects.create(
            cid="messaging:receipt-a",
            direction=SmsRelay.DIRECTION_OUTBOUND,
            external_id="receipt-a",
            status=SmsRelay.STATUS_PENDING,
        )
        payload = {"external_id": "receipt-a", "status": "delivered"}

        browser_only = self.client.post(
            self.receipt_url,
            payload,
            format="json",
            **self.jwt_auth(self.staff),
        )
        signed = self.signed_post(self.receipt_url, payload)
        replay = self.signed_post(self.receipt_url, payload)

        SmsRelay.objects.create(
            cid="messaging:receipt-b",
            direction=SmsRelay.DIRECTION_OUTBOUND,
            external_id="receipt-b",
            status=SmsRelay.STATUS_PENDING,
        )
        service = self.client.post(
            self.receipt_url,
            {"external_id": "receipt-b", "status": "failed"},
            format="json",
            HTTP_X_CHAT_SERVICE_TOKEN="service-secret",
        )

        self.assertEqual(browser_only.status_code, 403)
        self.assertEqual(signed.status_code, 200)
        self.assertEqual(replay.status_code, 409)
        self.assertEqual(service.status_code, 200)
        self.assertEqual(broadcast.call_count, 2)

    @patch("stream_server_django.chat_addons.sms_bridge.views._broadcast_to_cid")
    @patch("stream_server_django.chat_addons.sms_bridge.views.SmsProviderClient.send")
    def test_sms_send_accepts_staff_or_service_but_not_browser_member(
        self, provider_send, broadcast
    ):
        provider_send.side_effect = [
            SmsProviderResponse(external_id="send-service"),
            SmsProviderResponse(external_id="send-staff"),
        ]
        payload = {
            "cid": "messaging:sms-auth-room",
            "to": "+15551239999",
            "text": "Operational message",
        }

        member = self.client.post(
            self.send_url, payload, format="json", **self.jwt_auth(self.member)
        )
        service = self.client.post(
            self.send_url,
            payload,
            format="json",
            HTTP_X_CHAT_SERVICE_TOKEN="service-secret",
        )
        staff = self.client.post(
            self.send_url, payload, format="json", **self.jwt_auth(self.staff)
        )

        self.assertEqual(member.status_code, 403)
        self.assertEqual(service.status_code, 202)
        self.assertEqual(staff.status_code, 202)
        self.assertEqual(provider_send.call_count, 2)
        self.assertEqual(broadcast.call_count, 2)
