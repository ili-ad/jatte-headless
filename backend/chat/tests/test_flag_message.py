from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Flag

class FlagMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_flag_message_creates_flag(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        token = self.make_token()
        url = reverse("message-flag", kwargs={"message_id": msg.id})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Flag.objects.filter(message=msg, user__username="u1").count(), 1)
        self.assertIn("flag", res.data)

    def test_flag_message_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-flag", kwargs={"message_id": msg.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_flag_message_wrong_method(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-flag", kwargs={"message_id": msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
