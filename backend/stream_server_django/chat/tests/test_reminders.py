from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock, patch

from django.conf import settings
from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APITestCase
import jwt

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Channel, Message, Reminder, Room
from stream_server_django.chat.utils import group_name_for_cid

@override_settings(ROOT_URLCONF="chat.urls")
class ReminderAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="u1",
            email="u1@example.com",
            password="x",
            supabase_uid="u1",
        )
        self.other = CustomUser.objects.create_user(
            username="u2",
            email="u2@example.com",
            password="x",
            supabase_uid="u2",
        )
        self.room = Room.objects.create(uuid="r1", client="c1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(self.message)
        Reminder.objects.create(
            room=self.room,
            message=self.message,
            created_by=self.user,
            note="hi",
            remind_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )
        Reminder.objects.create(
            room=self.room,
            message=self.message,
            created_by=self.other,
            note="bye",
            remind_at=datetime(2025, 1, 2, tzinfo=timezone.utc),
        )

    def test_list_reminders(self):
        token = self.make_token()
        url = reverse("stream_server_django.reminders")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["note"], "hi")

    def test_reminders_requires_auth(self):
        url = reverse("stream_server_django.reminders")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_reminders_wrong_method(self):
        token = self.make_token()
        url = reverse("stream_server_django.reminders")
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    @patch("chat.api_views.get_channel_layer")
    def test_create_reminder(self, mock_get_channel_layer):
        channel_layer = Mock()
        channel_layer.group_send = AsyncMock()
        mock_get_channel_layer.return_value = channel_layer
        token = self.make_token()
        url = reverse("room-reminders", kwargs={"cid": f"messaging:{self.room.uuid}"})
        payload = {
            "remind_at": "2025-01-03T00:00:00Z",
            "message_id": self.message.id,
            "note": "new",
        }
        res = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Reminder.objects.filter(note="new").count(), 1)
        self.assertEqual(res.data["note"], "new")
        channel_layer.group_send.assert_awaited_once()
        group_name, event = channel_layer.group_send.await_args.args
        expected_group = group_name_for_cid(f"messaging:{self.room.uuid}")
        self.assertEqual(group_name, expected_group)
        self.assertEqual(event["payload"]["type"], "reminder.new")

    @patch("chat.api_views.get_channel_layer")
    def test_create_reminder_via_global_endpoint(self, mock_get_channel_layer):
        channel_layer = Mock()
        channel_layer.group_send = AsyncMock()
        mock_get_channel_layer.return_value = channel_layer
        token = self.make_token()
        url = reverse("stream_server_django.reminders")
        payload = {
            "cid": f"messaging:{self.room.uuid}",
            "remind_at": "2025-01-04T00:00:00Z",
            "message_id": self.message.id,
            "note": "global",
        }
        res = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["note"], "global")
        channel_layer.group_send.assert_awaited_once()
        group_name, event = channel_layer.group_send.await_args.args
        expected_group = group_name_for_cid(f"messaging:{self.room.uuid}")
        self.assertEqual(group_name, expected_group)
        self.assertEqual(event["payload"]["type"], "reminder.new")

    def test_create_reminder_requires_cid(self):
        token = self.make_token()
        url = reverse("stream_server_django.reminders")
        payload = {
            "remind_at": "2025-01-05T00:00:00Z",
        }
        res = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("cid", res.data)

    def test_create_reminder_requires_membership(self):
        Room.objects.create(uuid="r2", client="c2")
        token = self.make_token()
        url = reverse("stream_server_django.reminders")
        payload = {
            "cid": "messaging:r2",
            "remind_at": "2025-01-06T00:00:00Z",
        }
        res = self.client.post(
            url,
            payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 403)

