from unittest.mock import patch

import jwt
from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Message, Room, RoomMemberMute
from stream_server_django.chat_addons.admin_console.models import GatingConfig, MessageIntake
from stream_server_django.chat_addons.models import RoomOwnership


class AdminConsoleQueueTests(APITestCase):
    def setUp(self):
        self.operator = CustomUser.objects.create_user(
            username="op1",
            email="op1@example.com",
            password="secret",
            supabase_uid="op1",
        )
        self.other_operator = CustomUser.objects.create_user(
            username="op2",
            email="op2@example.com",
            password="secret",
            supabase_uid="op2",
        )

    def make_token(self, user: CustomUser) -> str:
        return jwt.encode(
            {"sub": user.supabase_uid, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_list_new_rooms(self):
        Room.objects.create(uuid="queue-r1", client="stream")
        token = self.make_token(self.operator)

        url = reverse("list-admin-queue")
        response = self.client.get(
            url,
            {"status": "new"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 1)
        self.assertEqual(payload["results"][0]["cid"], "messaging:queue-r1")

    def test_claim_room(self):
        room = Room.objects.create(uuid="claim-r1", client="stream")
        token = self.make_token(self.operator)

        url = reverse("claim-room", kwargs={"cid": "messaging:claim-r1"})
        response = self.client.post(url, {}, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["cid"], "messaging:claim-r1")
        self.assertEqual(payload["owner_id"], self.operator.supabase_uid)
        self.assertTrue(RoomOwnership.objects.filter(room=room, owner=self.operator).exists())

    def test_claim_rejected_when_owned_by_other(self):
        room = Room.objects.create(uuid="claim-r2", client="stream")
        RoomOwnership.objects.create(room=room, owner=self.other_operator)

        token = self.make_token(self.operator)
        url = reverse("claim-room", kwargs={"cid": "messaging:claim-r2"})
        response = self.client.post(url, {}, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 403)

    def test_list_mine_only_returns_owned_rooms(self):
        Room.objects.create(uuid="mine-new", client="stream")
        owned = Room.objects.create(uuid="mine-owned", client="stream")
        RoomOwnership.objects.create(room=owned, owner=self.operator)

        token = self.make_token(self.operator)
        url = reverse("list-admin-queue")

        response = self.client.get(
            url,
            {"status": "mine"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 1)
        self.assertEqual(payload["results"][0]["cid"], "messaging:mine-owned")
        self.assertEqual(payload["results"][0]["owner_id"], self.operator.supabase_uid)

        response_new = self.client.get(
            url,
            {"status": "new"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(len(response_new.json()["results"]), 1)
        self.assertEqual(response_new.json()["results"][0]["cid"], "messaging:mine-new")


class GatingRulesAPITests(APITestCase):
    def setUp(self):
        self.operator = CustomUser.objects.create_user(
            username="gate-admin",
            email="gate@example.com",
            password="secret",
            supabase_uid="gate-admin",
        )

    def make_token(self, user: CustomUser) -> str:
        return jwt.encode(
            {"sub": user.supabase_uid, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_get_and_update_rules(self):
        token = self.make_token(self.operator)
        url = reverse("get-gating-rules")

        response = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("languages", payload)
        self.assertEqual(payload["languages"], ["en"])

        update_payload = {
            "languages": ["en", "es"],
            "min_length": 3,
            "max_length": 500,
            "min_interval_seconds": 12,
            "blocklist": ["casino"],
        }
        update_response = self.client.put(
            url,
            update_payload,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.json()
        self.assertEqual(updated["languages"], ["en", "es"])
        config = GatingConfig.objects.get(slug=GatingConfig.DEFAULT_SLUG)
        self.assertEqual(config.blocklist, ["casino"])


@override_settings(
    ROOT_URLCONF="jatte.urls",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "intake-tests",
        }
    },
)
class IntakeWorkflowTests(APITestCase):
    def setUp(self):
        self.operator = CustomUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="secret",
            supabase_uid="admin",
        )
        self.visitor = CustomUser.objects.create_user(
            username="visitor",
            email="visitor@example.com",
            password="secret",
            supabase_uid="visitor",
        )
        self.room = Room.objects.create(uuid="intake-room", client="stream")

    def make_token(self, user: CustomUser) -> str:
        return jwt.encode(
            {"sub": user.supabase_uid, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self, token: str) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def create_pending_message(self, text: str = "?") -> Message:
        url = f"/api/rooms/{self.room.uuid}/messages/"
        visitor_token = self.make_token(self.visitor)
        with patch("chat.api_views._broadcast_to_cid") as mocked_broadcast:
            response = self.client.post(
                url,
                {"text": text},
                format="json",
                **self.auth_headers(visitor_token),
            )
        self.assertEqual(response.status_code, 201)
        mocked_broadcast.assert_not_called()
        message = Message.objects.order_by("-id").first()
        message.refresh_from_db()
        self.assertTrue(message.hidden)
        return message

    def test_hold_first_message_creates_intake(self):
        message = self.create_pending_message("?")
        intake = MessageIntake.objects.get(message=message)
        self.assertEqual(intake.status, MessageIntake.STATUS_PENDING)
        self.assertIsNone(intake.reason)
        self.assertEqual(intake.cid, f"messaging:{self.room.uuid}")

    def test_approve_intake_unhides_and_broadcasts(self):
        message = self.create_pending_message("?")
        intake = MessageIntake.objects.get(message=message)

        token = self.make_token(self.operator)
        url = reverse("approve-intake", kwargs={"message_id": str(message.id)})

        with patch(
            "backend.chat_addons.admin_console.services.gating._broadcast_message_new"
        ) as mocked_broadcast, patch(
            "backend.chat_addons.admin_console.services.gating.broadcast_message_update"
        ) as mocked_update:
            response = self.client.post(url, **self.auth_headers(token))

        self.assertEqual(response.status_code, 200)
        message.refresh_from_db()
        intake.refresh_from_db()
        self.assertFalse(message.hidden)
        self.assertEqual(intake.status, MessageIntake.STATUS_APPROVED)
        mocked_broadcast.assert_called_once()
        mocked_update.assert_not_called()

    def test_reject_intake_with_mute(self):
        message = self.create_pending_message("?")
        intake = MessageIntake.objects.get(message=message)
        token = self.make_token(self.operator)
        url = reverse("reject-intake", kwargs={"message_id": str(message.id)})

        response = self.client.post(
            url,
            {"mute": True, "reason": "spam"},
            format="json",
            **self.auth_headers(token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["muted"])
        self.assertTrue(
            RoomMemberMute.objects.filter(room=self.room, user=self.visitor).exists()
        )
        intake.refresh_from_db()
        self.assertEqual(intake.status, MessageIntake.STATUS_REJECTED)
        self.assertTrue(intake.muted)

    def test_blocklisted_text_rejected(self):
        GatingConfig.objects.update_or_create(
            slug=GatingConfig.DEFAULT_SLUG,
            defaults={
                "languages": ["en"],
                "min_length": 1,
                "max_length": 1000,
                "min_interval_seconds": 0,
                "blocklist": ["casino"],
            },
        )
        url = f"/api/rooms/{self.room.uuid}/messages/"
        visitor_token = self.make_token(self.visitor)
        with patch("chat.api_views._broadcast_to_cid") as mocked_broadcast:
            response = self.client.post(
                url,
                {"text": "visit this casino now"},
                format="json",
                **self.auth_headers(visitor_token),
            )

        self.assertEqual(response.status_code, 201)
        mocked_broadcast.assert_not_called()
        message = Message.objects.get()
        message.refresh_from_db()
        self.assertTrue(message.hidden)
        intake = MessageIntake.objects.get(message=message)
        self.assertEqual(intake.status, MessageIntake.STATUS_REJECTED)
        self.assertEqual(intake.reason, "spam")
