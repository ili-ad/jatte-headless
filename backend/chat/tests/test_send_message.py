from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class SendMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_send_message_creates_message(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "hello"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(room.messages.count(), 1)
        msg = room.messages.first()
        self.assertEqual(msg.body, "hello")
        self.assertEqual(msg.sent_by, "u1")

    def test_send_message_with_custom_data(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        payload = {"text": "hello", "custom_data": {"foo": 1}}
        res = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        msg = room.messages.first()
        self.assertEqual(msg.custom_data, {"foo": 1})

    def test_send_message_reply_to(self):
        room = Room.objects.create(uuid="r1", client="c1")
        parent = Message.objects.create(body="parent", sent_by="u2")
        room.messages.add(parent)
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.post(
            url,
            {"text": "reply", "reply_to": parent.id},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(res.status_code, 201)
        msg = room.messages.order_by("id").last()
        self.assertEqual(msg.reply_to, parent)

    def test_send_message_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_send_message_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
