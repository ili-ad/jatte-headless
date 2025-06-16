from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Reaction

class SendReactionAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_send_reaction_creates_reaction(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        token = self.make_token()
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.post(url, {"type": "like"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Reaction.objects.filter(message=msg, user__username="u1").count(), 1)
        self.assertEqual(res.data["type"], "like")

    def test_send_reaction_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.post(url, {"type": "like"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_send_reaction_wrong_method(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

