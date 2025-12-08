from django.conf import settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

import django
from django.core.management import call_command

django.setup()
call_command("migrate", run_syncdb=True, verbosity=0)

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Room, RoomMute, UserMute


class MutesAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

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
        self.third = CustomUser.objects.create_user(
            username="u3",
            email="u3@example.com",
            password="x",
            supabase_uid="u3",
        )

    def authenticate(self):
        token = self.make_token()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_mute_status_false_by_default(self):
        url = reverse("mutes:mute-status", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"muted": False})

    def test_mute_status_true_when_muted(self):
        UserMute.objects.create(user=self.user, target=self.other)
        url = reverse("mutes:mute-status", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"muted": True})

    def test_mute_status_requires_authentication(self):
        url = reverse("mutes:mute-status", kwargs={"username": self.other.username})

        res = self.client.get(url)

        self.assertEqual(res.status_code, 403)

    def test_mute_status_unknown_user(self):
        url = reverse("mutes:mute-status", kwargs={"username": "nope"})
        self.authenticate()

        res = self.client.get(url)

        self.assertEqual(res.status_code, 404)

    def test_list_muted_users(self):
        UserMute.objects.create(user=self.user, target=self.other)
        UserMute.objects.create(user=self.user, target=self.third)
        url = reverse("mutes:muted-users")
        self.authenticate()

        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        usernames = {entry["username"] for entry in res.data}
        self.assertEqual(usernames, {self.other.username, self.third.username})

    def test_list_muted_users_requires_authentication(self):
        url = reverse("mutes:muted-users")

        res = self.client.get(url)

        self.assertEqual(res.status_code, 403)

    def test_list_muted_channels(self):
        room1 = Room.objects.create(uuid="general", client="stream")
        room2 = Room.objects.create(uuid="random", client="stream")
        RoomMute.objects.create(user=self.user, room=room1)
        RoomMute.objects.create(user=self.user, room=room2)
        url = reverse("mutes:muted-channels")
        self.authenticate()

        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        cids = {entry["cid"] for entry in res.data}
        self.assertEqual(cids, {f"messaging:{room1.uuid}", f"messaging:{room2.uuid}"})

    def test_list_muted_channels_requires_authentication(self):
        url = reverse("mutes:muted-channels")

        res = self.client.get(url)

        self.assertEqual(res.status_code, 403)

    def test_mute_user_creates_record(self):
        url = reverse("mutes:mute-user", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"status": "ok"})
        self.assertTrue(UserMute.objects.filter(user=self.user, target=self.other).exists())

    def test_mute_user_idempotent(self):
        UserMute.objects.create(user=self.user, target=self.other)
        url = reverse("mutes:mute-user", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(UserMute.objects.filter(user=self.user, target=self.other).count(), 1)

    def test_mute_user_requires_authentication(self):
        url = reverse("mutes:mute-user", kwargs={"username": self.other.username})

        res = self.client.post(url)

        self.assertEqual(res.status_code, 403)

    def test_mute_user_unknown_target(self):
        url = reverse("mutes:mute-user", kwargs={"username": "nope"})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 404)

    def test_unmute_user_removes_record(self):
        UserMute.objects.create(user=self.user, target=self.other)
        url = reverse("mutes:unmute-user", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"status": "ok"})
        self.assertFalse(UserMute.objects.filter(user=self.user, target=self.other).exists())

    def test_unmute_user_idempotent(self):
        url = reverse("mutes:unmute-user", kwargs={"username": self.other.username})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 200)
        self.assertFalse(UserMute.objects.filter(user=self.user, target=self.other).exists())

    def test_unmute_user_requires_authentication(self):
        url = reverse("mutes:unmute-user", kwargs={"username": self.other.username})

        res = self.client.post(url)

        self.assertEqual(res.status_code, 403)

    def test_unmute_user_unknown_target(self):
        url = reverse("mutes:unmute-user", kwargs={"username": "nope"})
        self.authenticate()

        res = self.client.post(url)

        self.assertEqual(res.status_code, 404)
