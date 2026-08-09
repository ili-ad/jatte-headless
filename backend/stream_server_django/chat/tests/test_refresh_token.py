from django.urls import reverse
from rest_framework.test import APITestCase
from jatte.tests.jwt_factory import make_test_token

from django.contrib.auth import get_user_model

User = get_user_model()

class RefreshTokenAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return make_test_token(sub, email=email)

    def setUp(self):
        User.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_refresh_token_relays_existing_token(self):
        token = self.make_token()
        url = reverse("refresh-token")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["token"], token)
        self.assertEqual(res["Cache-Control"], "no-store")

    def test_refresh_token_requires_auth(self):
        url = reverse("refresh-token")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_refresh_token_wrong_method(self):
        token = self.make_token()
        url = reverse("refresh-token")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
