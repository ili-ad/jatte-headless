from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class SubarrayAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_subarray_returns_slice(self):
        token = self.make_token()
        url = reverse("subarray")
        res = self.client.post(url, {"array": [1,2,3,4], "start": 1, "end": 3}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["result"], [2,3])

    def test_subarray_requires_auth(self):
        url = reverse("subarray")
        res = self.client.post(url, {"array": [1]})
        self.assertEqual(res.status_code, 403)

    def test_subarray_wrong_method(self):
        token = self.make_token()
        url = reverse("subarray")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
