from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class ArchiveRoomAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_archive_room_sets_status_closed(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-archive", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        room.refresh_from_db()
        self.assertEqual(room.status, Room.CLOSED)
        self.assertEqual(res.data["status"], "ok")

    def test_archive_room_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-archive", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_archive_room_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-archive", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
