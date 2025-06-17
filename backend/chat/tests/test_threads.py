from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class ThreadsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.room = Room.objects.create(uuid="r1", client="c1")
        parent = Message.objects.create(body="p1", sent_by="u1")
        reply = Message.objects.create(body="r1", sent_by="u2", reply_to=parent)
        self.room.messages.add(parent, reply)
        parent2 = Message.objects.create(body="p2", sent_by="u3")
        self.room.messages.add(parent2)

    def test_list_threads(self):
        token = self.make_token()
        url = reverse("threads")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["body"], "p1")

    def test_threads_requires_auth(self):
        url = reverse("threads")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_threads_wrong_method(self):
        token = self.make_token()
        url = reverse("threads")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
