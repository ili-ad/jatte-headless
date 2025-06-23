from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Channel

class GetCIDMessagesAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_paginated_messages(self):
        room = Room.objects.create(uuid="r1", client="c1")
        ch = Channel.objects.create(uuid="c1", client="c1")
        m1 = Message.objects.create(body="m1", sent_by="u1", channel=ch)
        m2 = Message.objects.create(body="m2", sent_by="u1", channel=ch)
        m3 = Message.objects.create(body="m3", sent_by="u1", channel=ch)
        room.messages.add(m1, m2, m3)

        token = self.make_token()
        url = reverse("room-messages-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(f"{url}?limit=2", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["messages"]), 2)
        next_cursor = res.data["next"]
        self.assertIsNotNone(next_cursor)

        res2 = self.client.get(f"{url}?limit=2&before={next_cursor}", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(len(res2.data["messages"]), 1)

    def test_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-messages-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_create_message_via_cid(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.post(
            url,
            {"text": "hello"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(room.messages.count(), 1)
        self.assertEqual(room.messages.first().body, "hello")
