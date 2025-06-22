from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class WsAuthAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_ws_auth_ok(self):
        token = self.make_token()
        url = reverse("ws-auth")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIn("auth", res.data)
        self.assertIn("expires", res.data)

    def test_ws_auth_requires_auth(self):
        url = reverse("ws-auth")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_ws_auth_wrong_method(self):
        token = self.make_token()
        url = reverse("ws-auth")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_ws_auth_bad_token(self):
        token = self.make_token() + "x"
        url = reverse("ws-auth")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 403)
