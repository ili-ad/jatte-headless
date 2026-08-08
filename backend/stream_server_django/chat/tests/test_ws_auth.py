from django.urls import reverse
from rest_framework.test import APITestCase
from jatte.tests.jwt_factory import make_test_token

class WsAuthAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return make_test_token(sub, email=email)

    def test_ws_auth_ok(self):
        token = self.make_token()
        url = reverse("ws-auth")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIn("stream_server_django.auth", res.data)
        self.assertIn("expires", res.data)

    def test_ws_auth_requires_auth(self):
        url = reverse("ws-auth")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_ws_auth_wrong_method(self):
        token = self.make_token()
        url = reverse("ws-auth")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_ws_auth_bad_token(self):
        token = self.make_token() + "x"
        url = reverse("ws-auth")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 403)

    def test_ws_auth_live_ok(self):
        token = self.make_token()
        url = reverse("ws-auth-live")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"status": "ok"})

    def test_ws_auth_live_requires_auth(self):
        url = reverse("ws-auth-live")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)
