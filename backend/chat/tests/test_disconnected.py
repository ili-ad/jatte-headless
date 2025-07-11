from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class DisconnectedAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_state_toggles_via_session(self):
        token = self.make_token()
        # connect user -> sets disconnected False
        self.client.post(reverse("sync-user"), HTTP_AUTHORIZATION=f"Bearer {token}")
        url = reverse("disconnected")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["disconnected"])

        # disconnect user -> sets disconnected True
        self.client.delete(reverse("session"), HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["disconnected"])

    def test_requires_auth(self):
        url = reverse("disconnected")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("disconnected")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
