from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class RoomVisibleAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_room_list_includes_visible(self):
        Room.objects.create(uuid="r1", client="c1", data={"hidden": True})
        token = self.make_token()
        url = reverse("room-list")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data[0]["visible"])

    def test_room_detail_includes_visible(self):
        room = Room.objects.create(uuid="r1", client="c1", data={"hidden": False})
        token = self.make_token()
        url = reverse("room-detail", kwargs={"uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["visible"])
