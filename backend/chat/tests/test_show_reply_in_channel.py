from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class ShowReplyInChannelTests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_send_message_sets_flag(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "hello", "show_in_channel": True}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        msg = room.messages.first()
        self.assertTrue(msg.show_in_channel)

    def test_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "x", "show_in_channel": True}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
