from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class HideRoomAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_hide_room_sets_hidden_true(self):
        room = Room.objects.create(uuid="r1", client="c1", data={})
        token = self.make_token()
        url = reverse("room-hide", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        room.refresh_from_db()
        self.assertTrue(room.data.get("hidden"))
        self.assertEqual(res.data["status"], "ok")

    def test_hide_room_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-hide", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_hide_room_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-hide", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
