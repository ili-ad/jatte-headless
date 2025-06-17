from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser

class AttachmentAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_upload_attachment(self):
        token = self.make_token()
        url = reverse("attachments")
        res = self.client.post(url, {"name": "file1"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertIn("id", res.data["attachment"])
        self.assertEqual(res.data["attachment"]["name"], "file1")

    def test_requires_auth(self):
        url = reverse("attachments")
        res = self.client.post(url, {"name": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("attachments")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
