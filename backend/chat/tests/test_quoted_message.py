from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt


class QuotedMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_set_and_get_quoted_message(self):
        token = self.make_token()
        url = reverse("quoted-message")
        payload = {"id": "m1", "text": "hello"}
        res = self.client.post(url, {"quoted_message": payload}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "ok")

        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["quoted_message"], payload)

    def test_requires_auth(self):
        url = reverse("quoted-message")
        res = self.client.post(url, {"quoted_message": {"id": "x"}}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("quoted-message")
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
