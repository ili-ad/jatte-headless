from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Channel

class GetMembersCIDAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_paginated_members(self):
        room = Room.objects.create(uuid="r1", client="c1")
        ch = Channel.objects.create(uuid="c1", client="c1")
        for i in range(45):
            msg = Message.objects.create(body=f"m{i}", sent_by=f"u{i}", channel=ch)
            room.messages.add(msg)

        token = self.make_token()
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(f"{url}?limit=20&offset=20", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 20)

    def test_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
