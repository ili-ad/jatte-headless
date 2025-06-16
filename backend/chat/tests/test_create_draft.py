from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Draft

class CreateDraftAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_create_and_get_draft(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-draft", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "hello"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "ok")
        self.assertTrue(Draft.objects.filter(room=room, user__username="u1").exists())

        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["text"], "hello")

    def test_draft_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        url = reverse("room-draft", kwargs={"room_uuid": room.uuid})
        res = self.client.post(url, {"text": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_draft_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        token = self.make_token()
        url = reverse("room-draft", kwargs={"room_uuid": room.uuid})
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
