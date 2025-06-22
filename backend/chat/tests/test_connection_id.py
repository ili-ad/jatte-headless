from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

class ConnectionIDAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_connection_id_returns_value(self):
        token = self.make_token()
        url = reverse("connection-id")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        cid = res.data["connection_id"]
        self.assertTrue(isinstance(cid, str) and len(cid) > 0)

    def test_connection_id_stable_same_session(self):
        token = self.make_token()
        url = reverse("connection-id")
        res1 = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res1.status_code, 200)
        cid1 = res1.data["connection_id"]
        res2 = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res2.status_code, 200)
        cid2 = res2.data["connection_id"]
        self.assertEqual(cid1, cid2)

    def test_connection_id_unique_across_sessions(self):
        token = self.make_token()
        url = reverse("connection-id")
        res1 = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        cid1 = res1.data["connection_id"]
        # new client simulates new session
        other = self.client_class()
        res2 = other.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        cid2 = res2.data["connection_id"]
        self.assertNotEqual(cid1, cid2)

    def test_connection_id_requires_auth(self):
        url = reverse("connection-id")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_connection_id_wrong_method(self):
        token = self.make_token()
        url = reverse("connection-id")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

