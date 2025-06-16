from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser

class LinkPreviewAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_preview_requires_auth(self):
        url = reverse("link-preview")
        res = self.client.post(url, {"url": "https://example.com"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_preview_returns_data(self):
        token = self.make_token()
        url = reverse("link-preview")
        res = self.client.post(url, {"url": "https://example.com"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["url"], "https://example.com")
        self.assertIn("title", res.data)

    def test_preview_wrong_method(self):
        token = self.make_token()
        url = reverse("link-preview")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
