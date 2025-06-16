from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class EventFieldAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_event_field_roundtrip(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        payload = {
            "text": "hi",
            "event": {"type": "member.added", "user": {"id": "u2"}},
        }
        res = self.client.post(url, payload, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        msg = room.messages.first()
        self.assertEqual(msg.custom_data["event"]["type"], "member.added")
        self.assertEqual(res.data["event"]["type"], "member.added")

        # fetch back
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.data[0]["event"]["type"], "member.added")

