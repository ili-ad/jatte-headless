from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt


class InitStateAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_returns_default_state(self):
        token = self.make_token()
        url = reverse("init-state")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["text"], "")
        self.assertEqual(res.data["attachments"], [])
        self.assertIsNone(res.data["poll"])
        self.assertEqual(res.data["custom_data"], {})
        self.assertIsNone(res.data["quoted_message"])

    def test_requires_auth(self):
        url = reverse("init-state")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("init-state")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
