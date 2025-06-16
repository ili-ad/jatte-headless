from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Reaction
from accounts_supabase.models import CustomUser

class QueryReactionsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def test_query_reactions_returns_list(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        u2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        u3 = CustomUser.objects.create_user(username="u3", email="u3@example.com", password="x", supabase_uid="u3")
        Reaction.objects.create(message=msg, user=u2, type="like")
        Reaction.objects.create(message=msg, user=u3, type="love")
        token = self.make_token()
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 2)
        types = {r["type"] for r in res.data}
        self.assertEqual(types, {"like", "love"})

    def test_query_reactions_requires_auth(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_query_reactions_wrong_method(self):
        msg = Message.objects.create(body="hi", sent_by="u1")
        token = self.make_token()
        url = reverse("message-reactions", kwargs={"message_id": msg.id})
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
