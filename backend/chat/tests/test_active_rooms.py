from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room

class ActiveRoomsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_list_active_rooms(self):
        Room.objects.create(uuid="r1", client="c1", status=Room.ACTIVE)
        Room.objects.create(uuid="r2", client="c2", status=Room.CLOSED)
        token = self.make_token()
        url = reverse("active-rooms")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["uuid"], "r1")

    def test_active_rooms_requires_auth(self):
        url = reverse("active-rooms")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_active_rooms_wrong_method(self):
        token = self.make_token()
        url = reverse("active-rooms")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
