from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt
from accounts_supabase.models import CustomUser, UserProfile

class SyncUserAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_sync_user_creates_profile(self):
        token = self.make_token()
        url = reverse("sync-user")
        response = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "u1")
        self.assertTrue(CustomUser.objects.filter(username="u1").exists())
        user = CustomUser.objects.get(username="u1")
        self.assertTrue(UserProfile.objects.filter(user=user).exists())

    def test_sync_user_requires_auth(self):
        url = reverse("sync-user")
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)

    def test_sync_user_wrong_method(self):
        token = self.make_token()
        url = reverse("sync-user")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
