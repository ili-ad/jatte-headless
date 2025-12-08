from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
from django.utils import timezone
from unittest.mock import patch
import jwt

from stream_server_django.chat.models import ReadState, Room


def _iso(dt):
    return dt.isoformat().replace("+00:00", "Z")

class MarkReadAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_mark_read_returns_ok(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-mark-read", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "ok")

    def test_mark_read_broadcasts_message_read_event(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-mark-read", kwargs={"room_uuid": room.uuid})

        with patch("chat.api_views._broadcast_to_cid") as broadcast_mock:
            fixed_now = timezone.now()
            with patch.object(timezone, "now", return_value=fixed_now):
                res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(res.status_code, 200)
        read_state = ReadState.objects.get(channel__uuid=room.uuid)
        expected_payload = {
            "type": "message.read",
            "cid": f"messaging:{room.uuid}",
            "user": {
                "id": read_state.user,
                "channel_last_read_at": _iso(read_state.last_read),
                "channel_unread_count": 0,
                "unread_count": 0,
                "unread_channels": 0,
                "total_unread_count": 0,
            },
            "created_at": _iso(fixed_now),
        }
        broadcast_mock.assert_called_once_with(expected_payload["cid"], expected_payload)
