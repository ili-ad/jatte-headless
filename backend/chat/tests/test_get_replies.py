from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message

class GetRepliesAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_get_replies_returns_replies(self):
        room = Room.objects.create(uuid="r1", client="c1")
        parent = Message.objects.create(body="hi", sent_by="u1")
        reply1 = Message.objects.create(body="reply1", sent_by="u2", reply_to=parent)
        reply2 = Message.objects.create(body="reply2", sent_by="u3", reply_to=parent)
        room.messages.add(parent, reply1, reply2)

        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)
        bodies = {m["body"] for m in res.data}
        self.assertEqual(bodies, {"reply1", "reply2"})

    def test_get_replies_requires_auth(self):
        parent = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_get_replies_wrong_method(self):
        parent = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-replies", kwargs={"message_id": parent.id})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
