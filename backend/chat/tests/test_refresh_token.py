from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser

class RefreshTokenAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_refresh_token_returns_new_token(self):
        token = self.make_token()
        url = reverse("refresh-token")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        new_token = res.data["token"]
        decoded = jwt.decode(new_token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        self.assertEqual(decoded["sub"], "u1")

    def test_refresh_token_requires_auth(self):
        url = reverse("refresh-token")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_refresh_token_wrong_method(self):
        token = self.make_token()
        url = reverse("refresh-token")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
