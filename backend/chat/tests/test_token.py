from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class TokenAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_token_returns_passed_token(self):
        token = self.make_token()
        url = reverse("token-obtain")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["userToken"], token)

    def test_token_requires_auth(self):
        url = reverse("token-obtain")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_token_wrong_method(self):
        token = self.make_token()
        url = reverse("token-obtain")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
