from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import jwt
from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Room, RoomMemberMute
from stream_server_django.chat.utils import group_name_for_cid


@override_settings(ROOT_URLCONF="chat.urls")
class RoomMemberMuteAPITests(APITestCase):
    def make_token(self, sub: str, email: str):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.agent = CustomUser.objects.create_user(
            username="mod",
            email="mod@example.com",
            password="x",
            supabase_uid="mod",
        )
        self.member = CustomUser.objects.create_user(
            username="mem",
            email="member@example.com",
            password="x",
            supabase_uid="mem",
        )
        self.other = CustomUser.objects.create_user(
            username="other",
            email="other@example.com",
            password="x",
            supabase_uid="other",
        )

    def test_agent_can_mute_member(self):
        room = Room.objects.create(uuid="r1", client="stream", agent=self.agent)
        muted_until = (timezone.now() + timedelta(minutes=30)).replace(microsecond=0)
        token = self.make_token(sub="mod", email=self.agent.email)
        url = reverse("room-member-mutes", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.post(
            url,
            {"user_id": self.member.id, "muted_until": muted_until.isoformat()},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, 201)
        mute = RoomMemberMute.objects.get(room=room, user=self.member)
        self.assertEqual(mute.muted_by, self.agent)
        self.assertEqual(mute.muted_until, muted_until)
        self.assertEqual(res.data["id"], mute.id)
        self.assertEqual(res.data["user_id"], self.member.id)
        self.assertEqual(res.data["muted_by"], self.agent.id)
        self.assertIsInstance(res.data["created_at"], str)
        self.assertEqual(datetime.fromisoformat(res.data["muted_until"]), muted_until)

    def test_non_agent_cannot_mute_member(self):
        room = Room.objects.create(uuid="r2", client="stream", agent=None)
        token = self.make_token(sub="mem", email=self.member.email)
        url = reverse("room-member-mutes", kwargs={"cid": f"messaging:{room.uuid}"})

        res = self.client.post(
            url,
            {"user_id": self.other.id},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, 403)
        self.assertFalse(RoomMemberMute.objects.filter(room=room).exists())

    @patch("chat.api_views.get_channel_layer")
    def test_broadcasts_member_muted_event(self, mock_get_channel_layer):
        room = Room.objects.create(uuid="r3", client="stream", agent=self.agent)
        token = self.make_token(sub="mod", email=self.agent.email)
        url = reverse("room-member-mutes", kwargs={"cid": f"messaging:{room.uuid}"})

        channel_layer = Mock()
        channel_layer.group_send = AsyncMock()
        mock_get_channel_layer.return_value = channel_layer

        res = self.client.post(
            url,
            {"user_id": self.member.id},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(res.status_code, 201)
        channel_layer.group_send.assert_awaited_once()
        group_name, payload = channel_layer.group_send.await_args.args
        self.assertEqual(group_name, group_name_for_cid(f"messaging:{room.uuid}"))
        self.assertEqual(payload["type"], "chat.message")
        self.assertEqual(payload["payload"]["type"], "member.muted")
        self.assertEqual(payload["payload"]["cid"], f"messaging:{room.uuid}")
        self.assertEqual(payload["payload"]["target_user"], self.member.id)
        self.assertEqual(payload["payload"]["user_id"], self.member.id)
        self.assertTrue(payload["payload"]["muted"])
        self.assertEqual(payload["payload"]["muted_by"], self.agent.id)
        self.assertIn("ts", payload["payload"])
        self.assertIsNone(payload["payload"]["muted_until"])
