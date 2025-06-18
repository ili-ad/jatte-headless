from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt
from django.utils import timezone

from chat.models import Room, Message

class MessageUpdatedAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_update_message_sets_timestamp(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        token = self.make_token()
        url = reverse("message-detail", kwargs={"message_id": msg.id})
        before = msg.updated_at
        res = self.client.put(url, {"text": "hello"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertGreater(msg.updated_at, before)
        self.assertEqual(res.data["updated_at"].split("T")[0], msg.updated_at.isoformat().split("T")[0])

    def test_update_message_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-detail", kwargs={"message_id": msg.id})
        res = self.client.put(url, {"text": "x"}, format="json")
        self.assertEqual(res.status_code, 403)
