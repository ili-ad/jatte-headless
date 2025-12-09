"""Exercise the Rooms REST endpoints exposed for the shim handshake."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import django
import jwt
from django.conf import settings
from django.urls import reverse
from django.core.management import call_command

# Configure Django manually because pytest-django is not installed in this repo.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")
django.setup()
call_command("migrate", run_syncdb=True, verbosity=0)

from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Channel, Message, Room
User = get_user_model()


class RoomsEndpointsTests(APITestCase):
    """Validate list + member endpoints backed by the chat Room model."""

    def make_token(self, sub: str = "user-1", email: str = "user1@example.com") -> str:
        """Generate a signed Supabase-style JWT for authentication."""

        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_list_rooms_returns_expected_shape(self) -> None:
        """The `/rooms/` endpoint should return the minimal room payload."""

        Room.objects.create(uuid="room-1", client="client-1", data={"name": "General"})
        Room.objects.create(uuid="room-2", client="client-2", data={"name": "Random"})

        token = self.make_token()
        url = reverse("rooms:list")

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 2)
        for item in payload:
            self.assertIn("id", item)
            self.assertIn("uuid", item)
            self.assertIn("name", item)
            self.assertIn("data", item)

    def test_list_rooms_empty_returns_array(self) -> None:
        """An empty room table should still yield an empty list."""

        token = self.make_token()
        url = reverse("rooms:list")

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_rooms_requires_authentication(self) -> None:
        """The list endpoints must be protected by authentication."""

        url = reverse("rooms:list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_list_active_rooms_filters_closed_rooms(self) -> None:
        """Only active rooms should surface via `/rooms/active/`."""

        active = Room.objects.create(uuid="active-room", client="client")
        Room.objects.create(
            uuid="closed-room",
            client="client",
            status=Room.CLOSED,
            data={"name": "Closed"},
        )

        token = self.make_token()
        url = reverse("rooms:list-active")

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["uuid"], active.uuid)

    def test_list_room_members_returns_expected_wrapper(self) -> None:
        """Members should be wrapped inside an object keyed by `members`."""

        agent = User.objects.create_user(
            username="agent-uid",
            email="agent@example.com",
            password="x",
            supabase_uid="agent-uid",
        )
        client = User.objects.create_user(
            username="client-uid",
            email="client@example.com",
            password="x",
            supabase_uid="client-uid",
        )
        participant = User.objects.create_user(
            username="participant-uid",
            email="participant@example.com",
            password="x",
            supabase_uid="participant-uid",
        )

        room = Room.objects.create(
            uuid="room-members", client=client.supabase_uid, agent=agent
        )
        channel = Channel.objects.create(uuid="channel-members", client="client")

        room.messages.add(
            Message.objects.create(
                channel=channel, body="first", sent_by=client.supabase_uid
            ),
            Message.objects.create(
                channel=channel, body="second", sent_by=str(participant.id)
            ),
            Message.objects.create(
                channel=channel, body="third", sent_by=participant.supabase_uid
            ),
        )

        token = self.make_token(sub=client.supabase_uid, email=client.email)
        url = reverse("rooms:members-by-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("members", payload)
        members = payload["members"]
        self.assertTrue(members)
        first_member = members[0]
        self.assertIn("user_id", first_member)
        self.assertIn("role", first_member)
        self.assertIn("banned", first_member)

        member_ids = {item["user_id"] for item in members}
        self.assertIn(agent.id, member_ids)
        self.assertIn(client.id, member_ids)
        self.assertIn(participant.id, member_ids)

    def test_list_room_members_paginates_results(self) -> None:
        """Limit and offset should slice the members list."""

        agent = User.objects.create_user(
            username="agent",
            email="agent@example.com",
            password="x",
            supabase_uid="agent",
        )
        room = Room.objects.create(
            uuid="paginated-room", client="client-uid", agent=agent
        )
        channel = Channel.objects.create(uuid="channel-paginated", client="client")

        for index in range(75):
            user = User.objects.create_user(
                username=f"user-{index}",
                email=f"user-{index}@example.com",
                password="x",
                supabase_uid=f"user-{index}-uid",
            )
            message = Message.objects.create(
                channel=channel,
                body=f"message-{index}",
                sent_by=user.supabase_uid,
            )
            room.messages.add(message)

        token = self.make_token()
        url = reverse("rooms:members-by-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(
            f"{url}?limit=10&offset=20",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["members"]), 10)

    def test_list_room_members_validates_pagination(self) -> None:
        """Invalid pagination parameters should return a 400 response."""

        room = Room.objects.create(uuid="room-invalid", client="client")
        url = reverse("rooms:members-by-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        token = self.make_token()
        response = self.client.get(
            f"{url}?limit=-1",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 400)

    def test_list_room_members_requires_authentication(self) -> None:
        """The members endpoint must also require authentication."""

        room = Room.objects.create(uuid="room-auth", client="client")
        url = reverse("rooms:members-by-cid", kwargs={"cid": f"messaging:{room.uuid}"})

        response = self.client.get(url)

        self.assertEqual(response.status_code, 403)
