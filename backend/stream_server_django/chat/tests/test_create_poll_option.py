from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Room
from stream_server_django.polls.models import Poll, PollOption

User = get_user_model()


class CreatePollOptionAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = User.objects.create_user(
            username="u1", email="u1@example.com", password="x", supabase_uid="u1"
        )
        self.room = Room.objects.create(uuid="room-u1", client="u1")
        self.poll = Poll.objects.create(
            room=self.room,
            cid=self.room.cid,
            question="q?",
            created_by=self.user,
        )

    def test_create_poll_option(self):
        token = self.make_token()
        url = reverse("poll-option-create", kwargs={"poll_id": self.poll.id})
        res = self.client.post(url, {"text": "hello"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(PollOption.objects.filter(poll=self.poll, text="hello").count(), 1)
        option = PollOption.objects.get(poll=self.poll)
        self.assertEqual(res.data["poll_option"]["id"], str(option.id))

    def test_create_poll_option_requires_auth(self):
        url = reverse("poll-option-create", kwargs={"poll_id": self.poll.id})
        res = self.client.post(url, {"text": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("poll-option-create", kwargs={"poll_id": self.poll.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
