from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class CountUnreadAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_count_unread_before_and_after_mark_read(self):
        room = Room.objects.create(uuid="r1", client="c1")
        room.messages.add(Message.objects.create(body="hi", sent_by="u2"))
        room.messages.add(Message.objects.create(body="there", sent_by="u2"))

        token = self.make_token()
        count_url = reverse("room-count-unread", kwargs={"room_uuid": room.uuid})
        mark_url = reverse("room-mark-read", kwargs={"room_uuid": room.uuid})

        # before marking read, all messages are unread
        res = self.client.get(count_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["unread"], 2)

        # mark as read
        self.client.post(mark_url, HTTP_AUTHORIZATION=f"Bearer {token}")

        # no new messages -> unread should be 0
        res = self.client.get(count_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.data["unread"], 0)

        # add another message
        room.messages.add(Message.objects.create(body="new", sent_by="u2"))

        res = self.client.get(count_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.data["unread"], 1)
