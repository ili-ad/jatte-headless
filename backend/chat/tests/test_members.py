from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message
from accounts_supabase.models import CustomUser

class RoomMembersAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_members_returns_unique_user_ids(self):
        u1 = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        u2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        room = Room.objects.create(uuid="r1", client="u1", agent=u2)
        room.messages.add(Message.objects.create(body="hi", sent_by="u1"))
        room.messages.add(Message.objects.create(body="yo", sent_by="u2"))

        token = self.make_token()
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        ids = {m["id"] for m in res.data}
        self.assertEqual(ids, {"u1", "u2"})

    def test_members_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_members_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
