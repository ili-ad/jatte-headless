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
