from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class LastReadAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_last_read_returns_none_initially_then_timestamp(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-last-read", kwargs={"room_uuid": room.uuid})

        # initially no read state
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["last_read"])

        # mark as read
        mark_url = reverse("room-mark-read", kwargs={"room_uuid": room.uuid})
        self.client.post(mark_url, HTTP_AUTHORIZATION=f"Bearer {token}")

        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.data["last_read"], str)
