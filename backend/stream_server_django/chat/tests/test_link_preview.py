from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
from django.test import override_settings
import jwt

from django.contrib.auth import get_user_model

User = get_user_model()

@override_settings(ROOT_URLCONF="chat.urls")
class LinkPreviewAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = User.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

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
        self.assertEqual(res.data["title"], "example.com")

    def test_preview_validates_url(self):
        token = self.make_token()
        url = reverse("link-preview")
        res = self.client.post(url, {"url": "not-a-url"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 400)

    def test_preview_wrong_method(self):
        token = self.make_token()
        url = reverse("link-preview")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_frontend_alias_requires_auth(self):
        url = reverse("createLinkPreview")
        res = self.client.post(url, {"url": "https://example.com"}, format="json")
        self.assertIn(res.status_code, (401, 403))

    def test_frontend_alias_returns_data(self):
        token = self.make_token()
        url = reverse("createLinkPreview")
        res = self.client.post(
            url,
            {"url": "https://example.com"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"url": "https://example.com", "title": "example.com"})

    def test_frontend_alias_returns_422_for_invalid(self):
        token = self.make_token()
        url = reverse("createLinkPreview")
        res = self.client.post(
            url,
            {"url": "not-a-url"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.data, {"error": "invalid url"})

    def test_frontend_alias_payload_shape(self):
        token = self.make_token()
        url = reverse("createLinkPreview")
        res = self.client.post(
            url,
            {"url": "https://example.com"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(sorted(res.data.keys()), ["title", "url"])
