from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser
from chat.models import UserMute

class MuteStatusAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user1 = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.user2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")

    def test_mute_status_returns_boolean(self):
        token = self.make_token()
        url = reverse("mute-status", kwargs={"target_username": "u2"})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"muted": False})

        UserMute.objects.create(user=self.user1, target=self.user2)
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.data, {"muted": True})

    def test_mute_status_requires_auth(self):
        url = reverse("mute-status", kwargs={"target_username": "u2"})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_mute_status_wrong_method(self):
        token = self.make_token()
        url = reverse("mute-status", kwargs={"target_username": "u2"})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
