from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser

class QueryUsersAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_list_users_returns_users(self):
        CustomUser.objects.create_user(
            username="u1",
            email="u1@example.com",
            password="x",
            supabase_uid="u1",
        )
        CustomUser.objects.create_user(
            username="u2",
            email="u2@example.com",
            password="x",
            supabase_uid="u2",
        )

        token = self.make_token()
        url = reverse("query-users")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)
        usernames = {u["username"] for u in res.data}
        self.assertEqual(usernames, {"u1", "u2"})

    def test_query_users_requires_auth(self):
        url = reverse("query-users")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_query_users_wrong_method(self):
        token = self.make_token()
        url = reverse("query-users")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
