from datetime import timedelta
from unittest.mock import AsyncMock, Mock, patch

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Notification, Reminder as CanonicalReminder, Room
from stream_server_django.chat.utils import group_name_for_cid
from stream_server_django.reminders.models import Reminder as CompatibilityReminder


User = get_user_model()


@override_settings(
    ROOT_URLCONF="jatte.urls",
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class StateReminderAliasAuthorizationTests(APITestCase):
    def setUp(self):
        self.user_a = self._user("user-a")
        self.user_b = self._user("user-b")
        self.outsider = self._user("outsider")
        self.staff = self._user("staff", is_staff=True)
        self.room_a = Room.objects.create(
            uuid="room-a",
            client=self.user_a.supabase_uid,
            data={"name": "Room A", "secret": "alpha"},
        )
        self.room_b = Room.objects.create(
            uuid="room-b",
            client=self.user_b.supabase_uid,
            data={"name": "Room B", "secret": "bravo"},
        )
        Notification.objects.create(user=self.user_a, text="note-a")
        Notification.objects.create(user=self.user_b, text="note-b")

    def _user(self, username, **kwargs):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="pwd",
            supabase_uid=username,
            **kwargs,
        )

    def _headers(self, user):
        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def _reminder_payload(self, **updates):
        payload = {
            "text": "Follow up",
            "remind_at": (timezone.now() + timedelta(hours=1)).isoformat(),
        }
        payload.update(updates)
        return payload

    def _room_ids(self, response):
        return {
            room["uuid"] for room in response.data["stream_server_django.rooms"]
        }

    def test_recovery_aliases_share_authorized_room_set_and_notifications(self):
        before = (Room.objects.count(), Notification.objects.count())
        root = self.client.get("/recover-state/", **self._headers(self.user_a))
        canonical = self.client.get(
            "/api/recover-state/", **self._headers(self.user_a)
        )
        self.assertEqual((root.status_code, canonical.status_code), (200, 200))
        self.assertEqual(self._room_ids(root), {self.room_a.uuid})
        self.assertEqual(self._room_ids(canonical), {self.room_a.uuid})

        root_payload = root.json()
        serialized = str(root_payload)
        self.assertNotIn(self.room_b.uuid, serialized)
        self.assertNotIn("Room B", serialized)
        self.assertNotIn("bravo", serialized)
        self.assertEqual(len(root_payload["notifications"]), 1)
        self.assertEqual(
            root_payload["notifications"][0]["payload"], {"text": "note-a"}
        )
        self.assertEqual(
            (Room.objects.count(), Notification.objects.count()), before
        )

    def test_recovery_outsider_staff_and_authentication_policy(self):
        outsider_root = self.client.get(
            "/recover-state/", **self._headers(self.outsider)
        )
        outsider_api = self.client.get(
            "/api/recover-state/", **self._headers(self.outsider)
        )
        staff_root = self.client.get("/recover-state/", **self._headers(self.staff))
        staff_api = self.client.get(
            "/api/recover-state/", **self._headers(self.staff)
        )
        self.assertEqual(self._room_ids(outsider_root), set())
        self.assertEqual(self._room_ids(outsider_api), set())
        self.assertEqual(
            self._room_ids(staff_root), {self.room_a.uuid, self.room_b.uuid}
        )
        self.assertEqual(self._room_ids(staff_api), self._room_ids(staff_root))
        self.assertIn(self.client.get("/recover-state/").status_code, {401, 403})
        self.assertIn(
            self.client.get(
                "/recover-state/", HTTP_AUTHORIZATION="Bearer invalid"
            ).status_code,
            {401, 403},
        )

    def test_recovery_no_slash_variants_redirect_to_secured_views(self):
        for url, expected in (
            ("/recover-state", "/recover-state/"),
            ("/api/recover-state", "/api/recover-state/"),
        ):
            response = self.client.get(url, **self._headers(self.user_a))
            self.assertEqual(response.status_code, 301)
            self.assertEqual(response["Location"], expected)

    @patch("stream_server_django.reminders.views.get_channel_layer")
    def test_global_and_authorized_compatibility_reminders(self, get_channel_layer):
        channel_layer = Mock()
        channel_layer.group_send = AsyncMock()
        get_channel_layer.return_value = channel_layer
        global_response = self.client.post(
            "/reminders/",
            self._reminder_payload(),
            format="json",
            **self._headers(self.user_a),
        )
        self.assertEqual(global_response.status_code, 201)
        global_reminder = CompatibilityReminder.objects.get(
            pk=global_response.data["reminder"]["id"]
        )
        self.assertEqual(global_reminder.user, self.user_a)
        self.assertIsNone(global_reminder.cid)
        channel_layer.group_send.assert_not_awaited()

        room_response = self.client.post(
            "/reminders/",
            self._reminder_payload(cid=self.room_a.uuid),
            format="json",
            **self._headers(self.user_a),
        )
        self.assertEqual(room_response.status_code, 201)
        room_reminder = CompatibilityReminder.objects.get(
            pk=room_response.data["reminder"]["id"]
        )
        self.assertEqual(room_reminder.cid, self.room_a.cid)
        channel_layer.group_send.assert_awaited_once()
        group, event = channel_layer.group_send.await_args.args
        self.assertEqual(group, group_name_for_cid(self.room_a.cid))
        self.assertEqual(event["payload"]["type"], "reminder.new")
        self.assertEqual(event["payload"]["cid"], self.room_a.cid)

    @patch("stream_server_django.reminders.views._broadcast_new_reminder")
    def test_foreign_guessed_and_malformed_cids_have_zero_side_effects(self, broadcast):
        before = (
            CompatibilityReminder.objects.count(),
            Room.objects.count(),
            Notification.objects.count(),
        )
        for cid, expected_status in (
            (self.room_b.cid, 403),
            ("messaging:missing", 404),
            ("", 400),
            ("   ", 400),
            (None, 400),
            (17, 400),
            ({"room": "a"}, 400),
        ):
            with self.subTest(cid=cid):
                response = self.client.post(
                    "/reminders/",
                    self._reminder_payload(cid=cid),
                    format="json",
                    **self._headers(self.user_a),
                )
                self.assertEqual(response.status_code, expected_status)
                self.assertEqual(
                    (
                        CompatibilityReminder.objects.count(),
                        Room.objects.count(),
                        Notification.objects.count(),
                    ),
                    before,
                )
        broadcast.assert_not_called()

    def test_compatibility_reminder_ownership_is_unchanged(self):
        own = CompatibilityReminder.objects.create(
            user=self.user_a,
            text="own",
            remind_at=timezone.now(),
            cid=self.room_b.cid,
        )
        other = CompatibilityReminder.objects.create(
            user=self.user_b,
            text="other",
            remind_at=timezone.now(),
            cid=self.room_a.cid,
        )
        listing = self.client.get("/reminders/", **self._headers(self.user_a))
        self.assertEqual([item["id"] for item in listing.data], [str(own.id)])
        denied = self.client.delete(
            f"/reminders/{other.id}/", **self._headers(self.user_a)
        )
        self.assertEqual(denied.status_code, 404)
        self.assertTrue(CompatibilityReminder.objects.filter(pk=other.pk).exists())

    @patch("stream_server_django.chat.api_views._broadcast_reminder_created")
    def test_canonical_reminder_routes_retain_authorized_creation(self, broadcast):
        remind_at = self._reminder_payload()["remind_at"]
        global_route = self.client.post(
            "/api/reminders/",
            {"cid": self.room_a.cid, "remind_at": remind_at, "note": "global"},
            format="json",
            **self._headers(self.user_a),
        )
        room_route = self.client.post(
            f"/api/rooms/{self.room_a.cid}/reminders/",
            {"remind_at": remind_at, "note": "room"},
            format="json",
            **self._headers(self.user_a),
        )
        self.assertEqual((global_route.status_code, room_route.status_code), (201, 201))
        self.assertEqual(
            CanonicalReminder.objects.filter(
                room=self.room_a, created_by=self.user_a
            ).count(),
            2,
        )
        self.assertEqual(broadcast.call_count, 2)
        self.assertEqual(
            [call.args[0] for call in broadcast.call_args_list],
            [self.room_a, self.room_a],
        )

    @patch("stream_server_django.chat.api_views._broadcast_reminder_created")
    @patch("stream_server_django.reminders.views._broadcast_new_reminder")
    def test_reminder_aliases_deny_inaccessible_rooms_before_side_effects(
        self, compatibility_broadcast, canonical_broadcast
    ):
        before = (
            CompatibilityReminder.objects.count(),
            CanonicalReminder.objects.count(),
            Room.objects.count(),
            Notification.objects.count(),
        )
        compatibility = self.client.post(
            "/reminders/",
            self._reminder_payload(cid=self.room_b.cid),
            format="json",
            **self._headers(self.user_a),
        )
        canonical = self.client.post(
            "/api/reminders/",
            {
                "cid": self.room_b.cid,
                "remind_at": self._reminder_payload()["remind_at"],
                "note": "no",
            },
            format="json",
            **self._headers(self.user_a),
        )
        room_canonical = self.client.post(
            f"/api/rooms/{self.room_b.cid}/reminders/",
            {"remind_at": self._reminder_payload()["remind_at"], "note": "no"},
            format="json",
            **self._headers(self.user_a),
        )
        self.assertEqual(
            (compatibility.status_code, canonical.status_code, room_canonical.status_code),
            (403, 403, 403),
        )
        self.assertEqual(
            (
                CompatibilityReminder.objects.count(),
                CanonicalReminder.objects.count(),
                Room.objects.count(),
                Notification.objects.count(),
            ),
            before,
        )
        compatibility_broadcast.assert_not_called()
        canonical_broadcast.assert_not_called()
