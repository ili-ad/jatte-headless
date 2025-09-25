import jwt
from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts_supabase.models import UserProfile


class SyncUserViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.auth_header = self._build_auth_header()

    def _build_auth_header(self, sub: str = "user-1", email: str | None = None) -> str:
        payload = {"sub": sub, "email": email or f"{sub}@example.com"}
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return f"Bearer {token}"

    def test_sync_user_creates_profile_and_returns_current_user(self):
        response = self.client.post(
            "/api/sync-user/",
            {"display_name": "Ada Lovelace", "image_url": "https://example.com/a.png"},
            format="json",
            HTTP_AUTHORIZATION=self.auth_header,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["username"], "user-1")
        self.assertEqual(data["display_name"], "Ada Lovelace")
        self.assertEqual(data["image_url"], "https://example.com/a.png")
        self.assertEqual(data.get("extra"), {})

        profile = UserProfile.objects.get(user__username="user-1")
        self.assertEqual(profile.display_name, "Ada Lovelace")
        self.assertEqual(profile.image_url, "https://example.com/a.png")
        self.assertEqual(profile.extra, {})

        session = self.client.session
        self.assertFalse(session.get("disconnected"))
        self.assertTrue(session.get("initialized"))

    def test_sync_user_merges_unknown_fields_into_extra(self):
        response = self.client.post(
            "/api/sync-user/",
            {
                "display_name": "Grace Hopper",
                "timezone": "UTC",
                "extra": {"theme": "dark"},
            },
            format="json",
            HTTP_AUTHORIZATION=self.auth_header,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        profile = UserProfile.objects.get(user__username="user-1")
        self.assertEqual(profile.display_name, "Grace Hopper")
        self.assertEqual(profile.extra, {"theme": "dark", "timezone": "UTC"})
