from django.contrib.auth import get_user_model
from django.test import TestCase

from stream_server_django.chat.models import Room
from stream_server_django.chat_addons.contact_rooms import (
    CONTACT_ROOM_KIND,
    contact_user_key_for_user,
    get_or_create_contact_room_for_user,
)


class ContactRoomForUserTests(TestCase):
    def setUp(self):
        self.User = get_user_model()

    def test_creates_contact_room_for_user(self):
        user = self.User.objects.create(username="u1")

        room = get_or_create_contact_room_for_user(user)

        self.assertIsInstance(room, Room)
        self.assertEqual(Room.objects.count(), 1)
        self.assertEqual(room.client, contact_user_key_for_user(user))
        self.assertTrue(room.data.get("contact_room"))
        self.assertEqual(room.data.get("contact_user_key"), contact_user_key_for_user(user))
        self.assertEqual(room.data.get("contact_user_id"), user.id)
        self.assertEqual(room.data.get("contact_user_username"), user.username)
        self.assertEqual(room.data.get("kind"), CONTACT_ROOM_KIND)

    def test_reuses_existing_contact_room(self):
        user = self.User.objects.create(username="u2")

        first = get_or_create_contact_room_for_user(user)
        second = get_or_create_contact_room_for_user(user)

        self.assertEqual(first.id, second.id)
        self.assertEqual(Room.objects.count(), 1)

    def test_distinct_rooms_for_distinct_users(self):
        user_a = self.User.objects.create(username="user-a")
        user_b = self.User.objects.create(username="user-b")

        room_a = get_or_create_contact_room_for_user(user_a)
        room_b = get_or_create_contact_room_for_user(user_b)

        self.assertNotEqual(room_a.id, room_b.id)
        self.assertEqual(Room.objects.count(), 2)
