from unittest.mock import patch
from uuid import uuid4

from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
import jwt
from rest_framework.test import APITestCase

from chat.models import Channel, Room, Message


@override_settings(ROOT_URLCONF="chat.urls")
class RestoreMessageAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def make_room_and_message(self, *, deleted=False):
        channel = Channel.objects.create(uuid=str(uuid4()), client="c1")
        room = Room.objects.create(uuid=str(uuid4()), client="c1")
        msg = Message.objects.create(
            channel=channel,
            body="hi",
            sent_by="u1",
            deleted_at=timezone.now() if deleted else None,
        )
        room.messages.add(msg)
        return room, msg

    def test_restore_message_clears_deleted(self):
        room, msg = self.make_room_and_message(deleted=True)
        token = self.make_token()
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertIsNone(msg.deleted_at)
        self.assertEqual(res.data["id"], msg.id)

    def test_restore_message_requires_auth(self):
        _, msg = self.make_room_and_message(deleted=True)
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.post(url)
        self.assertEqual(res.status_code, 403)

    def test_restore_message_wrong_method(self):
        _, msg = self.make_room_and_message()
        token = self.make_token()
        url = reverse("message-restore", kwargs={"message_id": msg.id})
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_restore_message_alias_uses_same_view(self):
        room, msg = self.make_room_and_message(deleted=True)
        token = self.make_token()

        res = self.client.post(
            f"/messages/{msg.id}/restore/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, 200)
        msg.refresh_from_db()
        self.assertIsNone(msg.deleted_at)
        self.assertEqual(res.data["id"], msg.id)

    @patch("chat.api_views._broadcast_to_cid")
    def test_restore_message_broadcasts_update(self, broadcast):
        room, msg = self.make_room_and_message(deleted=True)
        token = self.make_token()

        self.client.post(
            f"/messages/{msg.id}/restore/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        broadcast.assert_called_once()
        cid_arg, payload = broadcast.call_args[0]
        self.assertEqual(cid_arg, f"messaging:{msg.channel.uuid}")
        self.assertEqual(payload["type"], "message.updated")
        self.assertEqual(payload["cid"], f"messaging:{msg.channel.uuid}")
        self.assertIn("message", payload)
        self.assertEqual(payload["message"]["id"], msg.id)
        self.assertIsNone(payload["message"]["deleted_at"])
