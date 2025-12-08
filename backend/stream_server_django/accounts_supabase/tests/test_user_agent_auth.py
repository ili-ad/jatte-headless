"""Tests for GET/POST /user-agent/ authentication requirements."""

import jwt
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class UserAgentAuthTests(APITestCase):
    """Verify the Supabase-protected user agent endpoints."""

    def setUp(self):
        super().setUp()
        self.token = self._make_token()
        self.auth_header = {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}
        self.url = reverse("user-agent")

    def _make_token(self, sub: str = "user-1", email: str | None = None) -> str:
        payload = {"sub": sub, "email": email or f"{sub}@example.com"}
        return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_get_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertIn(response.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

    def test_authorized_get_returns_expected_shape(self):
        response = self.client.get(self.url, **self.auth_header, HTTP_USER_AGENT="Vitest")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user_agent", response.data)

    def test_post_then_get_returns_persisted_user_agent(self):
        post_response = self.client.post(
            self.url,
            {"user_agent": "custom/1.0"},
            format="json",
            **self.auth_header,
        )
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)

        get_response = self.client.get(self.url, **self.auth_header)

        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data, {"user_agent": "custom/1.0"})
