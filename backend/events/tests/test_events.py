"""Integration tests for the events API surface."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django  # noqa: E402

django.setup()  # noqa: E402

from django.conf import settings  # noqa: E402
from django.core.management import call_command  # noqa: E402
from django.urls import reverse  # noqa: E402

import jwt  # noqa: E402
from rest_framework.test import APITestCase  # noqa: E402

call_command("migrate", run_syncdb=True, verbosity=0)

from events.models import EventNotification, EventSubscription  # noqa: E402


class EventsApiTests(APITestCase):
    """Exercise the events endpoints end-to-end."""

    def make_token(self, sub: str = "user-1", email: str = "user1@example.com") -> str:
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self, token: str | None = None) -> dict[str, str]:
        token = token or self.make_token()
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_register_subscriptions_persists_payload(self) -> None:
        url = reverse("events:register-subscriptions")
        payload = {"subscriptions": {"polls": {"enabled": True}}}

        response = self.client.post(url, payload, format="json", **self.auth_headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), payload)

        stored = EventSubscription.objects.get()
        self.assertEqual(stored.subscriptions, payload["subscriptions"])
        self.assertEqual(stored.user.username, "user-1")

    def test_register_subscriptions_requires_authentication(self) -> None:
        url = reverse("events:register-subscriptions")
        response = self.client.post(url, {"subscriptions": {}}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_listeners_returns_expected_channels(self) -> None:
        url = reverse("events:listeners")
        response = self.client.get(url, **self.auth_headers())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"listeners": ["polls", "threads", "reminders"]})

    def test_dispatch_event_persists_notification(self) -> None:
        dispatch_url = reverse("events:dispatch-event")
        event_payload = {"event": {"type": "demo.event", "payload": {"cid": "alpha", "value": 42}}}

        dispatch_response = self.client.post(
            dispatch_url, event_payload, format="json", **self.auth_headers()
        )

        self.assertEqual(dispatch_response.status_code, 200)
        self.assertEqual(dispatch_response.json(), {"event": event_payload["event"]})

        stored = EventNotification.objects.get()
        self.assertEqual(stored.event_type, "demo.event")
        self.assertEqual(stored.payload, {"cid": "alpha", "value": 42})
        self.assertEqual(stored.cid, "alpha")

        list_url = reverse("events:notifications")
        list_response = self.client.get(list_url, **self.auth_headers())
        self.assertEqual(list_response.status_code, 200)
        notifications = list_response.json()
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0]["type"], "demo.event")
        self.assertEqual(notifications[0]["payload"], {"cid": "alpha", "value": 42})
        self.assertIn("ts", notifications[0])

    def test_dispatch_event_requires_event_payload(self) -> None:
        url = reverse("events:dispatch-event")
        response = self.client.post(url, {}, format="json", **self.auth_headers())
        self.assertEqual(response.status_code, 400)
        self.assertIn("event", response.json())

    def test_notifications_require_authentication(self) -> None:
        url = reverse("events:notifications")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)
