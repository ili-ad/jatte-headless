from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser
from chat.models import Channel, Message, Room


class RoomMembersCIDViewTests(APITestCase):
    def make_token(self, sub="user-1", email="user1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def _create_message(self, *, channel, sent_by: str, body: str = "hello"):
        message = Message.objects.create(channel=channel, body=body, sent_by=sent_by)
        return message

    def test_members_shape(self):
        agent = CustomUser.objects.create_user(
            username="agent-uid",
            email="agent@example.com",
            password="x",
            supabase_uid="agent-uid",
        )
        client = CustomUser.objects.create_user(
            username="client-uid",
            email="client@example.com",
            password="x",
            supabase_uid="client-uid",
        )
        participant = CustomUser.objects.create_user(
            username="participant-uid",
            email="participant@example.com",
            password="x",
            supabase_uid="participant-uid",
        )

        room = Room.objects.create(uuid="room-1", client=client.supabase_uid, agent=agent)
        channel = Channel.objects.create(uuid="channel-1", client="client")

        first_message = self._create_message(
            channel=channel, sent_by=client.supabase_uid, body="first"
        )
        second_message = self._create_message(
            channel=channel,
            sent_by=str(participant.id),
            body="second",
        )
        third_message = self._create_message(
            channel=channel, sent_by=participant.supabase_uid, body="third"
        )

        room.messages.add(first_message, second_message, third_message)

        token = self.make_token(sub=client.supabase_uid, email=client.email)
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertIn("members", payload)
        members = payload["members"]
        self.assertIsInstance(members, list)
        self.assertTrue(members)

        first_member = members[0]
        self.assertIn("user_id", first_member)
        self.assertIn("role", first_member)
        self.assertIn("banned", first_member)

        member_ids = {item["user_id"] for item in members}
        self.assertIn(agent.id, member_ids)
        self.assertIn(client.id, member_ids)
        self.assertIn(participant.id, member_ids)

    def test_members_pagination(self):
        agent = CustomUser.objects.create_user(
            username="agent-uid",
            email="agent@example.com",
            password="x",
            supabase_uid="agent-uid",
        )
        room = Room.objects.create(uuid="room-2", client="client-uid", agent=agent)
        channel = Channel.objects.create(uuid="channel-2", client="client")

        for index in range(75):
            user = CustomUser.objects.create_user(
                username=f"user-{index}",
                email=f"user-{index}@example.com",
                password="x",
                supabase_uid=f"user-{index}-uid",
            )
            message = self._create_message(
                channel=channel,
                sent_by=user.supabase_uid,
                body=f"message-{index}",
            )
            room.messages.add(message)

        token = self.make_token()
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(
            f"{url}?limit=10&offset=20", HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["members"]), 10)

    def test_members_requires_auth(self):
        room = Room.objects.create(uuid="room-3", client="client-uid")
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(url)

        self.assertEqual(response.status_code, 403)

    def test_members_wrong_method(self):
        room = Room.objects.create(uuid="room-4", client="client-uid")
        token = self.make_token()
        url = reverse("room-members-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 405)

