from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Pin
from accounts_supabase.models import CustomUser

class UnpinMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="u1", email="u1@example.com", password="x", supabase_uid="u1"
        )
        self.room = Room.objects.create(uuid="r1", client="c1")
        self.msg = Message.objects.create(body="hi", sent_by="u1")
        self.room.messages.add(self.msg)
        self.user_token = self.make_token()
        Pin.objects.create(message=self.msg, user=self.user)

    def test_unpin_message_deletes_pin(self):
        url = reverse("message-unpin", kwargs={"message_id": self.msg.id})
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Pin.objects.filter(message=self.msg, user__username="u1").exists())

    def test_unpin_message_requires_auth(self):
        url = reverse("message-unpin", kwargs={"message_id": self.msg.id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_unpin_message_wrong_method(self):
        url = reverse("message-unpin", kwargs={"message_id": self.msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.user_token}")
        self.assertEqual(res.status_code, 405)
