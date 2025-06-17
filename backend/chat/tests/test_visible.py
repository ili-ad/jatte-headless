from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class RoomVisibleAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_visible_true_when_not_hidden(self):
        room = Room.objects.create(uuid="r1", client="c1", data={})
        token = self.make_token()
        url = reverse("room-visible", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["visible"], True)

    def test_visible_false_when_hidden(self):
        room = Room.objects.create(uuid="r2", client="c1", data={"hidden": True})
        token = self.make_token()
        url = reverse("room-visible", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["visible"], False)

    def test_requires_auth(self):
        room = Room.objects.create(uuid="r3", client="c1")
        url = reverse("room-visible", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)
