from django.test import TestCase

from stream_server_django.chat.contact_rooms import get_or_create_contact_room
from stream_server_django.chat.models import Room


class ContactRoomHelperTests(TestCase):
    def test_creates_room_with_membership_and_metadata(self):
        user_key = "user-123"

        room = get_or_create_contact_room(user_key)

        self.assertIsInstance(room, Room)
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(room.client, user_key)
        self.assertTrue(room.data.get("contact_room"))
        self.assertEqual(room.data.get("contact_user_key"), user_key)
        self.assertEqual(room.data.get("kind"), "contact-agent")

    def test_idempotent_for_same_user_key(self):
        user_key = "user-456"

        first = get_or_create_contact_room(user_key)
        second = get_or_create_contact_room(user_key)

        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(first.id, second.id)

    def test_distinct_rooms_for_different_user_keys(self):
        first = get_or_create_contact_room("user-a")
        second = get_or_create_contact_room("user-b")

        self.assertNotEqual(first.id, second.id)
        self.assertEqual(Room.objects.count(), 2)
