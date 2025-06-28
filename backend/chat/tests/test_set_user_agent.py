from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class UserAgentAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_set_and_get_user_agent(self):
        token = self.make_token()
        post_url = reverse("core-user-agent")
        res = self.client.post(post_url, {"user_agent": "ua1"}, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "ok")

        get_url = reverse("user-agent")
        res = self.client.get(get_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user_agent"], "ua1")

    def test_user_agent_requires_auth(self):
        url = reverse("core-user-agent")
        res = self.client.post(url, {"user_agent": "ua"})
        self.assertEqual(res.status_code, 403)
