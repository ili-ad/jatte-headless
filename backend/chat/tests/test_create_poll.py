from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser
from chat.models import Poll, PollOption

class PollAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_create_poll(self):
        token = self.make_token()
        url = reverse("poll-create")
        res = self.client.post(url, {"question": "q?", "options": ["a", "b"]}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        pid = res.data["poll"]["id"]
        self.assertTrue(Poll.objects.filter(id=pid, question="q?").exists())
        self.assertEqual(PollOption.objects.filter(poll_id=str(pid)).count(), 2)

    def test_create_poll_requires_auth(self):
        url = reverse("poll-create")
        res = self.client.post(url, {"question": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_create_poll_wrong_method(self):
        token = self.make_token()
        url = reverse("poll-create")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_delete_poll(self):
        poll = Poll.objects.create(question="bye", user=self.user)
        token = self.make_token()
        url = reverse("poll-detail", kwargs={"poll_id": poll.id})
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Poll.objects.filter(id=poll.id).exists())

    def test_delete_poll_requires_auth(self):
        poll = Poll.objects.create(question="a", user=self.user)
        url = reverse("poll-detail", kwargs={"poll_id": poll.id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_delete_poll_wrong_method(self):
        poll = Poll.objects.create(question="a", user=self.user)
        token = self.make_token()
        url = reverse("poll-detail", kwargs={"poll_id": poll.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
