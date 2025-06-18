from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class CompositionIsEmptyAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_returns_boolean(self):
        token = self.make_token()
        url = reverse("composition-is-empty")
        res = self.client.post(url, {"text": ""}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["is_empty"])
        res = self.client.post(url, {"text": "hi"}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["is_empty"])

    def test_requires_auth(self):
        url = reverse("composition-is-empty")
        res = self.client.post(url, {"text": ""})
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("composition-is-empty")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
