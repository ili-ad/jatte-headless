from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class AxiosInstanceAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_get_returns_method(self):
        token = self.make_token()
        url = reverse("axios-test")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["method"], "GET")

    def test_post_echoes_data(self):
        token = self.make_token()
        url = reverse("axios-test")
        res = self.client.post(
            url,
            {"a": 1},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["method"], "POST")
        self.assertEqual(res.data["data"], {"a": 1})

    def test_delete_ok(self):
        token = self.make_token()
        url = reverse("axios-test")
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["method"], "DELETE")

    def test_requires_auth(self):
        url = reverse("axios-test")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("axios-test")
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

