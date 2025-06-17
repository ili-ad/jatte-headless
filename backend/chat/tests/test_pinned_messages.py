from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Pin
from accounts_supabase.models import CustomUser

class PinnedMessagesAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.room = Room.objects.create(uuid="r1", client="c1")
        self.msg1 = Message.objects.create(body="hi", sent_by="u1")
        self.msg2 = Message.objects.create(body="bye", sent_by="u2")
        self.room.messages.add(self.msg1, self.msg2)
        Pin.objects.create(message=self.msg1, user=self.user)

    def test_list_pinned_messages(self):
        token = self.make_token()
        url = reverse("room-pinned-messages", kwargs={"room_uuid": self.room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.msg1.id)

    def test_pinned_messages_requires_auth(self):
        url = reverse("room-pinned-messages", kwargs={"room_uuid": self.room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_pinned_messages_wrong_method(self):
        token = self.make_token()
        url = reverse("room-pinned-messages", kwargs={"room_uuid": self.room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
