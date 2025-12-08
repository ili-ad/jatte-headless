from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from django.test import override_settings

from stream_server_django.chat.models import Channel, Message, Room

@override_settings(ROOT_URLCONF="chat.urls")
class RepliesAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def create_room(self, uuid: str = "r1") -> tuple[Room, Channel]:
        room = Room.objects.create(uuid=uuid, client="c1")
        channel = Channel.objects.create(uuid=uuid, client="c1")
        return room, channel

    def test_get_replies_returns_paginated_messages(self):
        room, channel = self.create_room()
        parent = Message.objects.create(channel=channel, body="hi", sent_by="u1")
        reply1 = Message.objects.create(
            channel=channel, body="reply1", sent_by="u2", reply_to=parent
        )
        reply2 = Message.objects.create(
            channel=channel, body="reply2", sent_by="u3", reply_to=parent
        )
        room.messages.add(parent, reply1, reply2)

        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIn("messages", res.data)
        self.assertEqual(len(res.data["messages"]), 2)
        bodies = {m["body"] for m in res.data["messages"]}
        self.assertEqual(bodies, {"reply1", "reply2"})
        for message in res.data["messages"]:
            self.assertEqual(message["parent_id"], parent.id)

    def test_get_replies_supports_pagination(self):
        room, channel = self.create_room()
        parent = Message.objects.create(channel=channel, body="hi", sent_by="u1")
        replies = [
            Message.objects.create(
                channel=channel,
                body=f"reply{i}",
                sent_by="u2",
                reply_to=parent,
            )
            for i in range(5)
        ]
        room.messages.add(parent, *replies)

        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": parent.id})

        first_page = self.client.get(
            url,
            {"limit": 2},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(len(first_page.data["messages"]), 2)
        next_cursor = first_page.data["next"]
        self.assertIsNotNone(next_cursor)

        second_page = self.client.get(
            url,
            {"limit": 2, "before": next_cursor},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(len(second_page.data["messages"]), 2)
        self.assertNotEqual(
            {m["id"] for m in first_page.data["messages"]},
            {m["id"] for m in second_page.data["messages"]},
        )

    def test_get_replies_requires_auth(self):
        _, channel = self.create_room()
        parent = Message.objects.create(channel=channel, body="hi", sent_by="u1")
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_get_replies_wrong_method(self):
        _, channel = self.create_room()
        parent = Message.objects.create(channel=channel, body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_get_replies_unknown_parent_returns_404(self):
        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": 9999})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 404)
