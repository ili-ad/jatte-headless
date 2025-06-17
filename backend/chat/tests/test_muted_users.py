from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import UserMute
from accounts_supabase.models import CustomUser

class MutedUsersAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user1 = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.user2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        self.user3 = CustomUser.objects.create_user(username="u3", email="u3@example.com", password="x", supabase_uid="u3")
        UserMute.objects.create(user=self.user1, target=self.user2)
        UserMute.objects.create(user=self.user1, target=self.user3)

    def test_list_muted_users(self):
        token = self.make_token()
        url = reverse("muted-users")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        usernames = {u["username"] for u in res.data}
        self.assertEqual(usernames, {"u2", "u3"})

    def test_muted_users_requires_auth(self):
        url = reverse("muted-users")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_muted_users_wrong_method(self):
        token = self.make_token()
        url = reverse("muted-users")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
