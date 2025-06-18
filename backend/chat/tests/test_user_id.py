from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt
from accounts_supabase.models import CustomUser

class UserIDAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_get_user_id(self):
        token = self.make_token()
        url = reverse("user")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["id"], self.user.id)

    def test_user_id_requires_auth(self):
        url = reverse("user")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_user_id_wrong_method(self):
        token = self.make_token()
        url = reverse("user")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
