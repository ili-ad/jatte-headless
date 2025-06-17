from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class RoomQueryAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_room_query_returns_messages_and_members(self):
        room = Room.objects.create(uuid="r1", client="c1")
        m1 = Message.objects.create(body="hi", sent_by="u1")
        m2 = Message.objects.create(body="yo", sent_by="u2")
        room.messages.add(m1, m2)
        token = self.make_token()
        url = reverse("room-query", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["messages"]), 2)
        self.assertEqual(len(res.data["members"]), 2)

    def test_room_query_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-query", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_room_query_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-query", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
