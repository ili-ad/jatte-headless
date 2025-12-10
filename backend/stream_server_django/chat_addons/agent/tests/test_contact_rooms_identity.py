from types import SimpleNamespace

from django.test import TestCase

from stream_server_django.chat.models import Room
from stream_server_django.chat_addons.agent import get_or_create_contact_room
from stream_server_django.common.identity import ChatIdentity


class ContactRoomForIdentityTests(TestCase):
    def _identity(self, **kwargs) -> ChatIdentity:
        return ChatIdentity(SimpleNamespace(**kwargs))

    def test_creates_contact_room_for_identity(self):
        identity = self._identity(supabase_uid="sup-123", username="guest-123")

        room = get_or_create_contact_room(identity)

        self.assertIsInstance(room, Room)
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(room.client, "sup-123")
        self.assertTrue(room.data.get("contact_room"))
        self.assertEqual(room.data.get("contact_user_key"), "sup-123")
        self.assertEqual(room.data.get("contact_identity_supabase_uid"), "sup-123")
        self.assertEqual(room.data.get("contact_identity_username"), "guest-123")

    def test_idempotent_for_same_identity(self):
        identity = self._identity(supabase_uid="sup-456")

        first = get_or_create_contact_room(identity)
        second = get_or_create_contact_room(identity)

        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(first.id, second.id)

    def test_distinct_identities_get_distinct_rooms(self):
        identity_a = self._identity(supabase_uid="sup-a")
        identity_b = self._identity(supabase_uid="sup-b")

        room_a = get_or_create_contact_room(identity_a)
        room_b = get_or_create_contact_room(identity_b)

        self.assertNotEqual(room_a.id, room_b.id)
        self.assertEqual(Room.objects.count(), 2)
