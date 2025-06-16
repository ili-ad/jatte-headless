from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model

from chat.models import Room

class RoomMembersAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_room_members_lists_client_and_agent(self):
        User = get_user_model()
        agent = User.objects.create_user(username="agent", email="a@example.com", password="x", supabase_uid="a")
        room = Room.objects.create(uuid="r1", client="c1", agent=agent)
        token = self.make_token()
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, [
            {"id": "c1", "username": "c1"},
            {"id": agent.id, "username": "agent"},
        ])

    def test_room_members_requires_auth(self):
        User = get_user_model()
        agent = User.objects.create_user(username="agent", email="a@example.com", password="x", supabase_uid="a")
        room = Room.objects.create(uuid="r1", client="c1", agent=agent)
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_room_members_wrong_method(self):
        User = get_user_model()
        agent = User.objects.create_user(username="agent", email="a@example.com", password="x", supabase_uid="a")
        room = Room.objects.create(uuid="r1", client="c1", agent=agent)
        token = self.make_token()
        url = reverse("room-members", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)


