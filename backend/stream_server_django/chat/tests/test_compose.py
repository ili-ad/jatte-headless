from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class ComposeAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_echoes_payload(self):
        token = self.make_token()
        url = reverse("compose")
        payload = {"text": "hello", "foo": 1}
        res = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["composition"], payload)

    def test_requires_auth(self):
        url = reverse("compose")
        res = self.client.post(url, {"text": "x"})
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("compose")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
