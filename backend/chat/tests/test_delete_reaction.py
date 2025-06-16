from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Message, Reaction
from accounts_supabase.models import CustomUser

class DeleteReactionAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def test_delete_reaction_removes_reaction(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        reaction = Reaction.objects.create(message=msg, user=self.user, type="like")
        token = self.make_token()
        url = reverse("reaction-detail", kwargs={"message_id": msg.id, "reaction_id": reaction.id})
        res = self.client.delete(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Reaction.objects.filter(id=reaction.id).exists())

    def test_delete_reaction_requires_auth(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        reaction = Reaction.objects.create(message=msg, user=self.user, type="like")
        url = reverse("reaction-detail", kwargs={"message_id": msg.id, "reaction_id": reaction.id})
        res = self.client.delete(url)
        self.assertEqual(res.status_code, 403)

    def test_delete_reaction_wrong_method(self):
        room = Room.objects.create(uuid="r1", client="c1")
        msg = Message.objects.create(body="hi", sent_by="u1")
        room.messages.add(msg)
        reaction = Reaction.objects.create(message=msg, user=self.user, type="like")
        token = self.make_token()
        url = reverse("reaction-detail", kwargs={"message_id": msg.id, "reaction_id": reaction.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
