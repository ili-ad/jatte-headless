from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class DisconnectUserAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_disconnect_user_returns_no_content(self):
        token = self.make_token()
        url = reverse('session')
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(res.data, None)

    def test_disconnect_requires_auth(self):
        url = reverse('session')
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_disconnect_wrong_method(self):
        token = self.make_token()
        url = reverse('session')
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
