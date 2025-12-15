import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from uuid import uuid4

from stream_server_django.chat.models import Channel, Message, Room

User = get_user_model()


class ResetRoomTests(APITestCase):
    def setUp(self):
        self.operator = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="secret",
            supabase_uid="admin",
        )
        self.operator.is_staff = True
        self.operator.save(update_fields=["is_staff"])

    def make_token(self, user: User) -> str:
        return jwt.encode(
            {"sub": user.supabase_uid, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_reset_removes_messages(self):
        room = Room.objects.create(uuid=str(uuid4()), client="stream")
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)

        first_message = Message.objects.create(
            channel=channel,
            body="Hello",
            sent_by="user1",
        )
        second_message = Message.objects.create(
            channel=channel,
            body="World",
            sent_by="user2",
        )
        room.messages.add(first_message, second_message)

        token = self.make_token(self.operator)
        url = reverse("reset-room", kwargs={"room_uuid": room.uuid})

        response = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload.get("ok"))
        self.assertEqual(payload.get("room_uuid"), room.uuid)
        self.assertEqual(payload.get("deleted_messages"), 2)
        self.assertEqual(Message.objects.filter(rooms=room).count(), 0)
