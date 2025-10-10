import jwt
from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts_supabase.models import UserProfile


class AuthIdentityViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.auth_header = self._build_auth_header()
        settings.ALLOWED_HOSTS = ["testserver", "localhost"]

    def _build_auth_header(self, sub: str = "user-1", email: str | None = None) -> str:
        payload = {"sub": sub, "email": email or f"{sub}@example.com"}
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return f"Bearer {token}"

    def test_sync_user_returns_minimal_payload(self):
        response = self.client.post(
            "/sync-user/",
            {"display_name": "Ada Lovelace", "timezone": "UTC"},
            format="json",
            HTTP_AUTHORIZATION=self.auth_header,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(set(data.keys()), {"id", "username"})
        self.assertEqual(data["username"], "user-1")

        profile = UserProfile.objects.get(user__username="user-1")
        self.assertEqual(profile.display_name, "Ada Lovelace")
        self.assertEqual(profile.extra, {"timezone": "UTC"})

    def test_sync_user_requires_authentication(self):
        response = self.client.post("/sync-user/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_current_user_returns_minimal_payload(self):
        self.client.post(
            "/sync-user/",
            {"display_name": "Ada"},
            format="json",
            HTTP_AUTHORIZATION=self.auth_header,
        )

        response = self.client.get(
            "/user/", HTTP_AUTHORIZATION=self.auth_header, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(set(data.keys()), {"id", "username"})
        self.assertEqual(data["username"], "user-1")

    def test_current_user_requires_authentication(self):
        response = self.client.get("/user/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_token_returns_token(self):
        response = self.client.get(
            "/refresh-token/", HTTP_AUTHORIZATION=self.auth_header
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("token", data)
        self.assertIsInstance(data["token"], str)

    def test_refresh_token_requires_authentication(self):
        response = self.client.get("/refresh-token/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_session_delete_marks_session(self):
        self.client.post(
            "/sync-user/",
            {},
            format="json",
            HTTP_AUTHORIZATION=self.auth_header,
        )

        response = self.client.delete(
            "/session/", HTTP_AUTHORIZATION=self.auth_header
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        session = self.client.session
        self.assertTrue(session.get("disconnected"))
        self.assertFalse(session.get("initialized", True))

    def test_session_delete_requires_authentication(self):
        response = self.client.delete("/session/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_id_returns_identifier(self):
        response = self.client.get(
            "/client-id/", HTTP_AUTHORIZATION=self.auth_header
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("client_id", data)
        self.assertIsInstance(data["client_id"], str)
        self.assertTrue(data["client_id"])  # not empty

    def test_client_id_requires_authentication(self):
        response = self.client.get("/client-id/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_connection_id_returns_identifier(self):
        response = self.client.get(
            "/connection-id/", HTTP_AUTHORIZATION=self.auth_header
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("connection_id", data)
        self.assertTrue(data["connection_id"])

        # Second call should reuse the same id from the session
        response_again = self.client.get(
            "/connection-id/", HTTP_AUTHORIZATION=self.auth_header
        )
        self.assertEqual(response_again.status_code, status.HTTP_200_OK)
        self.assertEqual(response_again.json()["connection_id"], data["connection_id"])

    def test_connection_id_requires_authentication(self):
        response = self.client.get("/connection-id/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ws_auth_returns_ok(self):
        response = self.client.get("/ws-auth/", HTTP_AUTHORIZATION=self.auth_header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_ws_auth_requires_authentication(self):
        response = self.client.get("/ws-auth/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
