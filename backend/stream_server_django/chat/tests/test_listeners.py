from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class ListenersAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_returns_listeners(self):
        token = self.make_token()
        url = reverse("listeners")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["listeners"], ["message.new", "settings.updated"])

    def test_requires_auth(self):
        url = reverse("listeners")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("listeners")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
