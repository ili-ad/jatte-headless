from datetime import datetime, timezone

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

from django.conf import settings

from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Channel, Message, Reminder, Room
User = get_user_model()


@override_settings(ROOT_URLCONF="chat.urls")
class ReminderDeleteAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="u1",
            email="u1@example.com",
            password="pw",
            supabase_uid="u1",
        )
        self.other = User.objects.create_user(
            username="u2",
            email="u2@example.com",
            password="pw",
            supabase_uid="u2",
        )
        self.room = Room.objects.create(uuid="room-1", client="client-1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(self.message)
        self.reminder = Reminder.objects.create(
            room=self.room,
            message=self.message,
            created_by=self.user,
            note="ping",
            remind_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )
        self.other_reminder = Reminder.objects.create(
            room=self.room,
            message=self.message,
            created_by=self.other,
            note="pong",
            remind_at=datetime(2025, 1, 2, tzinfo=timezone.utc),
        )

    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256"
        )

    def auth_headers(self, user=None):
        if user is None:
            user = self.user
        token = self.make_token(sub=user.supabase_uid, email=user.email)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_owner_can_delete_reminder(self):
        url = reverse("reminder-detail", kwargs={"reminder_id": self.reminder.id})
        res = self.client.delete(url, **self.auth_headers(self.user))
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Reminder.objects.filter(id=self.reminder.id).exists())

    def test_non_owner_gets_forbidden(self):
        url = reverse("reminder-detail", kwargs={"reminder_id": self.reminder.id})
        res = self.client.delete(url, **self.auth_headers(self.other))
        self.assertEqual(res.status_code, 403)
        self.assertTrue(Reminder.objects.filter(id=self.reminder.id).exists())

    def test_missing_reminder_returns_not_found(self):
        url = reverse("reminder-detail", kwargs={"reminder_id": 9999})
        res = self.client.delete(url, **self.auth_headers(self.user))
        self.assertEqual(res.status_code, 404)
