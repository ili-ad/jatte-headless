from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class DispatchEventAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_echoes_event(self):
        token = self.make_token()
        url = reverse("dispatch-event")
        payload = {"type": "typing.start", "user_id": "u2"}
        res = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["event"], payload)

    def test_requires_auth(self):
        url = reverse("dispatch-event")
        res = self.client.post(url, {"type": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("dispatch-event")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
