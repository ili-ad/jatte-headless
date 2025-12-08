from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt


class IntroAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_returns_intro_message(self):
        token = self.make_token()
        url = reverse("intro")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["custom_type"], "channel.intro")
        self.assertTrue(res.data["id"])

    def test_requires_auth(self):
        url = reverse("intro")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("intro")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

