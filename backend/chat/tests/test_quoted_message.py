import jwt
from django.conf import settings
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase


class QuotedMessageAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()
        self.url = reverse("quoted-message")

    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def authenticate(self):
        token = self.make_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return token

    def test_auth_required(self):
        res = self.client.get(self.url)
        self.assertIn(res.status_code, {401, 403})

    def test_set_then_get(self):
        self.authenticate()
        payload = {"id": "m1", "text": "hello"}

        res = self.client.post(self.url, {"quoted_message": payload}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"status": "ok"})

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"quoted_message": payload})

    def test_clear(self):
        self.authenticate()
        payload = {"id": "m1", "text": "hello"}
        self.client.post(self.url, {"quoted_message": payload}, format="json")

        res = self.client.post(self.url, {"quoted_message": None}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"status": "ok"})

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"quoted_message": None})

    def test_shape_validation(self):
        self.authenticate()
        res = self.client.post(self.url, {"quoted_message": "oops"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data, {"detail": "quoted_message must be object or null"})
