from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
from django.utils import timezone
import jwt

from chat.models import Room, Message

class RestoreMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_restore_message_clears_deleted(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1", deleted_at=timezone.now())
        room.messages.add(msg)
        token = self.make_token()
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertIsNone(msg.deleted_at)
        self.assertEqual(res.data["id"], msg.id)

    def test_restore_message_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1", deleted_at=timezone.now())
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_restore_message_wrong_method(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
