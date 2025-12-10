from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from stream_server_django.chat.models import Room
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, RoomAgentFlag
from stream_server_django.chat_addons.contact_rooms import (
    CONTACT_ROOM_KIND,
    contact_user_key_for_user,
    get_or_create_contact_agent_room_for_user,
)


class ContactAgentRoomTests(TestCase):
    def setUp(self):
        self.User = get_user_model()

    def test_creates_agent_enabled_room(self):
        user = self.User.objects.create(username="contact-agent", supabase_uid="contact-agent")

        room, created = get_or_create_contact_agent_room_for_user(user)

        self.assertTrue(created)
        self.assertIsInstance(room, Room)
        self.assertEqual(room.client, contact_user_key_for_user(user))
        self.assertEqual(room.data.get("kind"), CONTACT_ROOM_KIND)
        self.assertEqual(room.data.get("purpose"), "contact_agent")
        self.assertIn("Contact agent", room.data.get("name"))
        self.assertEqual(room.agent.username, "ai-bot")

        canonical = f"messaging:{room.uuid}"
        policy = AgentRoomPolicy.objects.get(cid=canonical)
        self.assertTrue(policy.agent_enabled)

        flag = RoomAgentFlag.objects.get(room=room)
        self.assertTrue(flag.agent_enabled)

    def test_reuses_existing_room(self):
        user = self.User.objects.create(username="contact-reuse", supabase_uid="contact-reuse")

        first, created_first = get_or_create_contact_agent_room_for_user(user)
        second, created_second = get_or_create_contact_agent_room_for_user(user)

        self.assertTrue(created_first)
        self.assertFalse(created_second)
        self.assertEqual(first.id, second.id)
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(AgentRoomPolicy.objects.count(), 1)
        self.assertEqual(RoomAgentFlag.objects.count(), 1)

    def test_rejects_anonymous_user(self):
        with self.assertRaises(ValueError):
            get_or_create_contact_agent_room_for_user(AnonymousUser())
