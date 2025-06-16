from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class RoomDetailAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_room_detail_returns_room(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-detail", kwargs={"uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["uuid"], room.uuid)
        self.assertEqual(res.data["client"], room.client)

    def test_room_detail_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-detail", kwargs={"uuid": room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_room_detail_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-detail", kwargs={"uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
