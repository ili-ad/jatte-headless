from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser
from chat.models import Poll

class PollListAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        Poll.objects.create(question="q1", user=self.user)
        Poll.objects.create(question="q2", user=self.user)

    def test_list_polls(self):
        token = self.make_token()
        url = reverse("poll-create")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)

    def test_polls_requires_auth(self):
        url = reverse("poll-create")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_polls_wrong_method(self):
        token = self.make_token()
        url = reverse("poll-create")
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
