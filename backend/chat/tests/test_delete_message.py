from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class DeleteMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_delete_message_marks_deleted(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        token = self.make_token()
        url = reverse("message-detail", kwargs={"message_id": msg.id})
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertIsNotNone(msg.deleted_at)
        self.assertEqual(room.messages.count(), 1)
        self.assertEqual(res.data["id"], msg.id)
        self.assertIsNotNone(res.data["deleted_at"])

    def test_delete_message_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-detail", kwargs={"message_id": msg.id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_delete_message_wrong_method(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-detail", kwargs={"message_id": msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["id"], msg.id)
