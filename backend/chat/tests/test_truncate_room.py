from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class TruncateRoomAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_truncate_room_clears_messages(self):
        room = Room.objects.create(uuid="r1", client="c1")
        m1 = Message.objects.create(body="hi", sent_by="u1")
        m2 = Message.objects.create(body="yo", sent_by="u1")
        room.messages.add(m1, m2)
        token = self.make_token()
        url = reverse("room-truncate", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        room.refresh_from_db()
        self.assertEqual(room.messages.count(), 0)
        self.assertEqual(res.data["status"], "ok")

    def test_truncate_room_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-truncate", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_truncate_room_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-truncate", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
