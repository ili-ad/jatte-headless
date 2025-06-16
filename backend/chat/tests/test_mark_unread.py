from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, ReadState

class MarkUnreadAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_mark_unread_clears_readstate(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        mark_url = reverse("room-mark-read", kwargs={"room_uuid": room.uuid})
        unmark_url = reverse("room-mark-unread", kwargs={"room_uuid": room.uuid})

        self.client.post(mark_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(ReadState.objects.filter(room=room).count(), 1)

        res = self.client.post(unmark_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(ReadState.objects.filter(room=room).count(), 0)

    def test_mark_unread_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-mark-unread", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_mark_unread_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-mark-unread", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
