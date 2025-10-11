from unittest.mock import patch
from uuid import uuid4

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from chat.models import Channel, Message, Room


@override_settings(ROOT_URLCONF="chat.urls")
class MessageHideAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        self.User = get_user_model()

    def make_token(self, sub="mod", email="mod@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def create_user(self, username, **extra):
        defaults = {"email": f"{username}@example.com"}
        defaults.update(extra)
        return self.User.objects.create_user(username=username, password="pw", **defaults)

    def create_room_with_message(self, *, sent_by="author", client="c1"):
        room = Room.objects.create(uuid=str(uuid4()), client=client)
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        message = Message.objects.create(channel=channel, body="hi", sent_by=sent_by)
        room.messages.add(message)
        return room, message

    def auth_headers(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_moderator_can_hide_message(self):
        self.create_user("mod", is_staff=True)
        room, message = self.create_room_with_message(client="viewer")
        token = self.make_token(sub="mod")

        res = self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        self.assertEqual(res.status_code, 200)
        message.refresh_from_db()
        self.assertTrue(message.hidden)
        self.assertEqual(res.data["status"], "hidden")
        self.assertTrue(res.data["message"]["hidden"])

    def test_moderator_can_unhide_message(self):
        self.create_user("mod", is_staff=True)
        room, message = self.create_room_with_message(client="viewer")
        token = self.make_token(sub="mod")

        self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))
        res = self.client.delete(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        self.assertEqual(res.status_code, 200)
        message.refresh_from_db()
        self.assertFalse(message.hidden)
        self.assertEqual(res.data["status"], "visible")
        self.assertFalse(res.data["message"]["hidden"])

    def test_non_moderator_cannot_hide_others_message(self):
        self.create_user("viewer")
        room, message = self.create_room_with_message(client="viewer")
        token = self.make_token(sub="viewer", email="viewer@example.com")

        res = self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        self.assertEqual(res.status_code, 403)
        message.refresh_from_db()
        self.assertFalse(message.hidden)

    @override_settings(CHAT_ALLOW_SELF_HIDE=True)
    def test_author_can_hide_when_enabled(self):
        self.create_user("author")
        room, message = self.create_room_with_message(sent_by="author")
        token = self.make_token(sub="author", email="author@example.com")

        res = self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        self.assertEqual(res.status_code, 200)
        message.refresh_from_db()
        self.assertTrue(message.hidden)
        self.assertEqual(message.hidden_by.username, "author")

    def test_hidden_messages_excluded_for_non_moderators(self):
        self.create_user("mod", is_staff=True)
        self.create_user("viewer")
        room, message = self.create_room_with_message(client="viewer")
        mod_token = self.make_token(sub="mod")
        viewer_token = self.make_token(sub="viewer", email="viewer@example.com")

        self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(mod_token))

        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res = self.client.get(url, **self.auth_headers(viewer_token))

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["messages"], [])

    def test_moderator_can_include_hidden_messages(self):
        self.create_user("mod", is_staff=True)
        room, message = self.create_room_with_message()
        token = self.make_token(sub="mod")

        self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        url = reverse("room-messages", kwargs={"room_uuid": room.uuid})
        res_default = self.client.get(url, **self.auth_headers(token))
        res_with_hidden = self.client.get(
            f"{url}?include_hidden=1", **self.auth_headers(token)
        )

        self.assertEqual(res_default.status_code, 200)
        self.assertEqual(res_default.data["messages"], [])
        self.assertEqual(res_with_hidden.status_code, 200)
        self.assertEqual(res_with_hidden.data["messages"][0]["id"], message.id)
        self.assertTrue(res_with_hidden.data["messages"][0]["hidden"])

    @patch("chat.api_views.broadcast_message_update")
    def test_hide_and_unhide_emit_message_updated(self, broadcast):
        self.create_user("mod", is_staff=True)
        room, message = self.create_room_with_message()
        token = self.make_token(sub="mod")

        self.client.post(f"/messages/{message.id}/hide/", **self.auth_headers(token))
        self.client.delete(f"/messages/{message.id}/hide/", **self.auth_headers(token))

        self.assertEqual(broadcast.call_count, 2)
        first_call_message = broadcast.call_args_list[0].args[0]
        second_call_message = broadcast.call_args_list[1].args[0]
        self.assertEqual(first_call_message.id, message.id)
        self.assertEqual(second_call_message.id, message.id)
        self.assertTrue(first_call_message.hidden)
        self.assertFalse(second_call_message.hidden)
