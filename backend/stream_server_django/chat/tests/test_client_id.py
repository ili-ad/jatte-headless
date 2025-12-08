from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class ClientIDAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_client_id_returns_value(self):
        token = self.make_token()
        url = reverse("client-id")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        cid = res.data["client_id"]
        self.assertTrue(isinstance(cid, str) and len(cid) > 0)

    def test_client_id_requires_auth(self):
        url = reverse("client-id")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_client_id_wrong_method(self):
        token = self.make_token()
        url = reverse("client-id")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
