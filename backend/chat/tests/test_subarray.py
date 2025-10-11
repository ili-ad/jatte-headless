from django.conf import settings
from django.urls import reverse
import jwt
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(ROOT_URLCONF="chat.urls")
class SubarrayAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self):
        token = self.make_token()
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_happy_path(self):
        url = reverse("subarray")
        response = self.client.post(
            url,
            {"array": [1, 2, 3, 4], "start": 1, "end": 3},
            **self.auth_headers(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], [2, 3])

    def test_end_optional(self):
        url = reverse("subarray")
        response = self.client.post(
            url,
            {"array": [1, 2, 3], "start": 1},
            **self.auth_headers(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], [2, 3])

    def test_negative_start(self):
        url = reverse("subarray")
        response = self.client.post(
            url,
            {"array": [1, 2, 3], "start": -1},
            **self.auth_headers(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], [3])

    def test_oob_indices(self):
        url = reverse("subarray")
        response = self.client.post(
            url,
            {"array": [1, 2], "start": 5},
            **self.auth_headers(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["result"], [])

    def test_validation_errors(self):
        url = reverse("subarray")
        response = self.client.post(
            url,
            {"array": "not-a-list", "start": "zero"},
            **self.auth_headers(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
        self.assertIn("array", response.data["detail"])

    def test_auth_required(self):
        url = reverse("subarray")
        response = self.client.post(url, {"array": [1, 2], "start": 0}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
