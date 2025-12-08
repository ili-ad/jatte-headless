from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt


class EditingAuditStateAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_echoes_posted_state(self):
        token = self.make_token()
        url = reverse("editing-audit-state")
        res = self.client.post(
            url,
            {"draft_update": 1, "state_update": 2},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["draft_update"], 1)
        self.assertEqual(res.data["state_update"], 2)

    def test_requires_auth(self):
        url = reverse("editing-audit-state")
        res = self.client.post(url, {"draft_update": 1})
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("editing-audit-state")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

