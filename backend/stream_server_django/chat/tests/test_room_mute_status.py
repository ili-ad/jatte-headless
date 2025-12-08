from django.conf import settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

from stream_server_django.chat.models import Room, RoomMute
from stream_server_django.accounts_supabase.models import CustomUser


class RoomMuteStatusAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="u1",
            email="u1@example.com",
            password="x",
            supabase_uid="u1",
        )

    def test_returns_false_when_not_muted(self):
        room = Room.objects.create(uuid="r1", client="stream")
        token = self.make_token()
        url = reverse("room-mute-status", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"muted": False, "muted_until": None})

    def test_returns_true_when_muted(self):
        room = Room.objects.create(uuid="r2", client="stream")
        RoomMute.objects.create(user=self.user, room=room)
        token = self.make_token()
        url = reverse("room-mute-status", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["muted"])
        self.assertIsNone(res.data["muted_until"])

    def test_requires_authentication(self):
        room = Room.objects.create(uuid="r3", client="stream")
        url = reverse("room-mute-status", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.get(url)

        self.assertEqual(res.status_code, 403)

    def test_rejects_wrong_method(self):
        room = Room.objects.create(uuid="r4", client="stream")
        token = self.make_token()
        url = reverse("room-mute-status", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(res.status_code, 405)
