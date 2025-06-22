from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, RoomMute
from accounts_supabase.models import CustomUser

class GetConfigAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="u1", email="u1@example.com", password="x", supabase_uid="u1"
        )

    def test_get_config_returns_metadata(self):
        room = Room.objects.create(uuid="r1", client="u1", data={"name": "Chat"})
        token = self.make_token()
        url = reverse("room-config", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"name": "Chat", "type": "messaging", "muted": False})

    def test_get_config_returns_muted_true(self):
        room = Room.objects.create(uuid="r1", client="u1")
        RoomMute.objects.create(user=self.user, room=room)
        token = self.make_token()
        url = reverse("room-config", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["muted"])

    def test_get_config_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="u1")
        url = reverse("room-config", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_get_config_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="u1")
        token = self.make_token()
        url = reverse("room-config", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
