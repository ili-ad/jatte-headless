"""Exercise the State & Recovery endpoints."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import django
import jwt
from django.conf import settings
from django.core.management import call_command
from django.urls import reverse

# Configure Django manually because pytest-django is unavailable.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = PROJECT_ROOT / "backend"
for candidate in (PROJECT_ROOT, BACKEND_ROOT):
    if str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")
django.setup()
call_command("migrate", run_syncdb=True, verbosity=0)

from rest_framework.test import APITestCase  # noqa: E402

from accounts_supabase.models import CustomUser  # noqa: E402
from chat.models import Notification, Room  # noqa: E402


class StateRecoveryEndpointsTests(APITestCase):
    """Validate recover-state helpers used during initialization."""

    def setUp(self) -> None:
        self.user = CustomUser.objects.create_user(
            username="user-1",
            email="user1@example.com",
            password="x",
            supabase_uid="user-1",
        )
        self.other_user = CustomUser.objects.create_user(
            username="user-2",
            email="user2@example.com",
            password="x",
            supabase_uid="user-2",
        )

    def make_token(self, sub: str | None = None, email: str | None = None) -> str:
        """Generate a signed Supabase-compatible JWT."""

        sub = sub or self.user.supabase_uid
        email = email or self.user.email
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_recover_state_returns_rooms_and_notifications(self) -> None:
        """Cold-start recovery should surface rooms and notifications."""

        Room.objects.create(
            uuid="general",
            client=self.user.supabase_uid,
            data={"name": "general", "topic": "welcome"},
        )
        Notification.objects.create(user=self.user, text="welcome")
        Notification.objects.create(user=self.other_user, text="ignore")

        token = self.make_token()
        url = reverse("state:recover-state")

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("rooms", payload)
        self.assertIn("notifications", payload)

        rooms = payload["rooms"]
        self.assertEqual(len(rooms), 1)
        room = rooms[0]
        self.assertEqual(room["uuid"], "general")
        self.assertEqual(room["name"], "general")
        self.assertIn("data", room)
        self.assertIn("topic", room["data"])

        notifications = payload["notifications"]
        self.assertEqual(len(notifications), 1)
        note = notifications[0]
        self.assertEqual(note["type"], "notification")
        self.assertEqual(note["payload"], {"text": "welcome"})
        self.assertIsInstance(note["ts"], str)

    def test_flag_endpoints_return_expected_payloads(self) -> None:
        """The UI flag helpers should respond with static booleans."""

        token = self.make_token()

        disconnected_url = reverse("state:disconnected")
        response = self.client.get(
            disconnected_url, HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"disconnected": False})

        initialized_url = reverse("state:initialized")
        response = self.client.get(
            initialized_url, HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"initialized": True})

    def test_editing_audit_state_echoes_payload(self) -> None:
        """The audit diagnostic endpoint should echo integers back."""

        token = self.make_token()
        url = reverse("state:editing-audit-state")
        payload = {"draft_update": 3, "state_update": 1}

        response = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), payload)

    def test_state_endpoints_require_authentication(self) -> None:
        """All state recovery endpoints should enforce authentication."""

        endpoints = [
            ("get", reverse("state:recover-state"), None),
            ("get", reverse("state:disconnected"), None),
            ("get", reverse("state:initialized"), None),
            (
                "post",
                reverse("state:editing-audit-state"),
                {"draft_update": 1, "state_update": 0},
            ),
        ]

        for method, url, payload in endpoints:
            client_method = getattr(self.client, method)
            if payload is None:
                response = client_method(url)
            else:
                response = client_method(url, payload, format="json")
            self.assertEqual(response.status_code, 403)
