from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import PollOption


class CreatePollOptionAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_create_poll_option(self):
        token = self.make_token()
        url = reverse("poll-option-create", kwargs={"poll_id": "p1"})
        res = self.client.post(url, {"text": "hello"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(PollOption.objects.filter(poll_id="p1", text="hello").count(), 1)
        option = PollOption.objects.get(poll_id="p1")
        self.assertEqual(res.data["poll_option"]["id"], option.id)

    def test_create_poll_option_requires_auth(self):
        url = reverse("poll-option-create", kwargs={"poll_id": "p1"})
        res = self.client.post(url, {"text": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("poll-option-create", kwargs={"poll_id": "p1"})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
