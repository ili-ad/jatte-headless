from django.test import TestCase
from django.contrib.auth import get_user_model

from stream_server_django.chat.contact_rooms import get_or_create_contact_room
from stream_server_django.rooms.utils import user_has_room_access

User = get_user_model()


class ContactRoomHelperTests(TestCase):
    def test_creates_contact_room_for_user(self):
        user = User.objects.create_user(
            username="contact-user",
            email="contact@example.com",
            password="x",
            supabase_uid="contact-uid",
        )

        room = get_or_create_contact_room(user)

        self.assertEqual(room.data.get("kind"), "contact")
        self.assertTrue(room.data.get("is_private"))
        self.assertEqual(room.client, "contact-uid")
        self.assertTrue(user_has_room_access(user, room))
        self.assertEqual(room.cid, f"messaging:{room.uuid}")

    def test_reuses_existing_contact_room(self):
        user = User.objects.create_user(
            username="existing-user",
            email="existing@example.com",
            password="x",
            supabase_uid="existing-uid",
        )

        first = get_or_create_contact_room(user)
        second = get_or_create_contact_room(user)

        self.assertEqual(first.id, second.id)

    def test_falls_back_to_non_supabase_identifier(self):
        user = User.objects.create_user(
            username="plain-user",
            email="plain@example.com",
            password="x",
        )

        room = get_or_create_contact_room(user)

        self.assertEqual(room.client, "plain-user")
        self.assertEqual(room.data.get("kind"), "contact")
