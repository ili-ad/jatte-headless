from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt


class HasSendableDataAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_returns_boolean(self):
        token = self.make_token()
        url = reverse("has-sendable-data")
        # only text
        res = self.client.post(url, {"text": "hi"}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["has_sendable_data"])
        # attachments
        res = self.client.post(url, {"attachments": ["a1"]}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertTrue(res.data["has_sendable_data"])
        # poll
        res = self.client.post(url, {"poll": {"question": "q"}}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertTrue(res.data["has_sendable_data"])
        # custom data
        res = self.client.post(url, {"custom_data": {"foo": 1}}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertTrue(res.data["has_sendable_data"])
        # empty
        res = self.client.post(url, {}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertFalse(res.data["has_sendable_data"])

    def test_requires_auth(self):
        url = reverse("has-sendable-data")
        res = self.client.post(url, {"text": "hi"})
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("has-sendable-data")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
