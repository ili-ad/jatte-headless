import jwt
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APITestCase


class GetAppSettingsTests(APITestCase):
    def make_token(self, sub="user-1", email="user1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_returns_settings(self):
        url = reverse("core:app-settings")
        token = self.make_token()
        res = self.client.get(
            url,
            HTTP_AUTHORIZATION=f"Bearer {token}",
            HTTP_HOST="localhost",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"file_uploads": True})

    def test_requires_auth(self):
        url = reverse("core:app-settings")
        res = self.client.get(url, HTTP_HOST="localhost")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        url = reverse("core:app-settings")
        token = self.make_token()
        res = self.client.post(
            url,
            HTTP_AUTHORIZATION=f"Bearer {token}",
            HTTP_HOST="localhost",
        )
        self.assertEqual(res.status_code, 405)
