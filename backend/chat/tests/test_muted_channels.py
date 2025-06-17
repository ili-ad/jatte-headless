from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, RoomMute
from accounts_supabase.models import CustomUser

class MutedChannelsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user1 = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.user2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        self.room1 = Room.objects.create(uuid="r1", client="c1")
        self.room2 = Room.objects.create(uuid="r2", client="c2")
        RoomMute.objects.create(user=self.user1, room=self.room1)

    def test_list_muted_channels(self):
        token = self.make_token()
        url = reverse("muted-channels")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["uuid"], "r1")

    def test_muted_channels_requires_auth(self):
        url = reverse("muted-channels")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_muted_channels_wrong_method(self):
        token = self.make_token()
        url = reverse("muted-channels")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
