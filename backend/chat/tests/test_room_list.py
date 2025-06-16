from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class RoomListAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_list_rooms_returns_rooms(self):
        Room.objects.create(uuid="r1", client="c1")
        Room.objects.create(uuid="r2", client="c2")

        token = self.make_token()
        url = reverse("room-list")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)
        uuids = {room["uuid"] for room in res.data}
        self.assertEqual(uuids, {"r1", "r2"})

    def test_room_list_requires_auth(self):
        url = reverse("room-list")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_room_list_wrong_method(self):
        token = self.make_token()
        url = reverse("room-list")
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
