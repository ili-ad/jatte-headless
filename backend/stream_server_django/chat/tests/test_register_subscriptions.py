from unittest.mock import AsyncMock, Mock, patch

import pytest
from django.conf import settings as django_settings
from django.urls import reverse
import jwt
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Room, WebPushSubscription
from stream_server_django.chat.utils import group_name_for_cid


@pytest.fixture
def settings():  # type: ignore[override]
    from django.conf import settings as django_settings

    return django_settings


class RegisterSubscriptionsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            django_settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_registers_and_persists_subscriptions(self):
        token = self.make_token()
        url = reverse("register-subscriptions")
        payload = {
            "subscriptions": [
                {
                    "endpoint": "https://push.example/1",
                    "expirationTime": None,
                    "keys": {"p256dh": "pkey", "stream_server_django.auth": "akey"},
                }
            ],
            "client_id": "browser-1",
            "platform": "web",
        }

        response = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["subscriptions"], payload["subscriptions"])
        self.assertEqual(response.data.get("client_id"), payload["client_id"])
        self.assertEqual(response.data.get("platform"), payload["platform"])

        stored = WebPushSubscription.objects.get()
        self.assertEqual(stored.user.username, "u1")
        self.assertEqual(stored.endpoint, payload["subscriptions"][0]["endpoint"])
        self.assertEqual(stored.p256dh, payload["subscriptions"][0]["keys"]["p256dh"])
        self.assertEqual(stored.auth, payload["subscriptions"][0]["keys"]["stream_server_django.auth"])
        self.assertEqual(stored.client_id, payload["client_id"])
        self.assertEqual(stored.platform, payload["platform"])

    def test_updates_existing_subscription(self):
        token = self.make_token()
        url = reverse("register-subscriptions")
        initial_payload = {
            "subscriptions": [
                {
                    "endpoint": "https://push.example/1",
                    "keys": {"p256dh": "initial", "stream_server_django.auth": "initial"},
                }
            ]
        }

        self.client.post(
            url,
            initial_payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        updated_payload = {
            "subscriptions": [
                {
                    "endpoint": "https://push.example/1",
                    "expirationTime": 123.0,
                    "keys": {"p256dh": "updated", "stream_server_django.auth": "changed"},
                }
            ],
            "platform": "ios",
        }

        response = self.client.post(
            url,
            updated_payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 201)
        stored = WebPushSubscription.objects.get()
        self.assertEqual(stored.p256dh, "updated")
        self.assertEqual(stored.auth, "changed")
        self.assertEqual(stored.expiration_time, 123.0)
        self.assertEqual(stored.platform, "ios")

    @patch("chat.webpush.get_channel_layer")
    def test_broadcasts_subscription_event(self, mock_get_channel_layer):
        token = self.make_token()
        room = Room.objects.create(uuid="room-1", client="c1")

        channel_layer = Mock()
        channel_layer.group_send = AsyncMock()
        mock_get_channel_layer.return_value = channel_layer

        url = reverse("register-subscriptions")
        payload = {
            "subscriptions": [
                {
                    "endpoint": "https://push.example/1",
                    "keys": {"p256dh": "pkey", "stream_server_django.auth": "akey"},
                }
            ],
            "client_id": f"messaging:{room.uuid}",
        }

        response = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 201)
        channel_layer.group_send.assert_awaited_once()
        group_name, event = channel_layer.group_send.await_args.args
        self.assertEqual(group_name, group_name_for_cid(f"messaging:{room.uuid}"))
        self.assertEqual(event["type"], "chat.message")
        payload_sent = event["payload"]
        self.assertEqual(payload_sent["type"], "push.subscription.registered")
        self.assertEqual(payload_sent["cid"], f"messaging:{room.uuid}")
        self.assertEqual(payload_sent.get("subscriptions"), response.data["subscriptions"])
        self.assertEqual(payload_sent.get("client_id"), f"messaging:{room.uuid}")
        self.assertEqual(payload_sent.get("user"), "u1")

    def test_requires_auth(self):
        url = reverse("register-subscriptions")
        response = self.client.post(
            url,
            {"subscriptions": []},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("register-subscriptions")
        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 405)
