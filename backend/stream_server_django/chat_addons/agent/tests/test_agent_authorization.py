from unittest.mock import Mock, patch

from jatte.tests.jwt_factory import make_test_token
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.agent.models import RoomAgentFlag


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat_addons.tests.pr5_urls"
)
class AgentAuthorizationTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="room-member", supabase_uid="room-member"
        )
        self.outsider = User.objects.create_user(
            username="room-outsider", supabase_uid="room-outsider"
        )
        self.agent = User.objects.create_user(
            username="room-agent", supabase_uid="room-agent"
        )
        self.staff = User.objects.create_user(
            username="chat-staff", supabase_uid="chat-staff", is_staff=True
        )
        self.room = Room.objects.create(
            uuid="agent-auth-room",
            client=self.member.username,
            agent=self.agent,
        )
        channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        self.message = Message.objects.create(
            channel=channel,
            body="Please help",
            sent_by=self.member.username,
        )
        self.room.messages.add(self.message)
        RoomAgentFlag.objects.create(room=self.room, agent_enabled=True)

    def token(self, user) -> str:
        return make_test_token(user.supabase_uid, email=user.email)

    def auth(self, user) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token(user)}"}

    @patch("stream_server_django.chat_addons.agent.views.get_agent_service")
    def test_member_can_invoke_own_room_but_outsider_cannot(self, service_factory):
        service = Mock()
        service.enqueue_generate.return_value = "job-pr5"
        service_factory.return_value = service
        url = reverse("agent-invoke", kwargs={"cid": self.room.cid})
        payload = {
            "room_uuid": self.room.uuid,
            "last_human_message_id": self.message.id,
        }

        denied = self.client.post(
            url, payload, format="json", **self.auth(self.outsider)
        )
        self.assertEqual(denied.status_code, 403)
        service.enqueue_generate.assert_not_called()

        allowed = self.client.post(
            url, payload, format="json", **self.auth(self.member)
        )
        self.assertEqual(allowed.status_code, 202, allowed.data)
        service.enqueue_generate.assert_called_once()

    def test_agent_controls_require_room_agent_or_staff(self):
        enable_url = reverse("enable-agent", kwargs={"cid": self.room.cid})
        disable_url = reverse("disable-agent", kwargs={"cid": self.room.cid})

        member_denied = self.client.post(
            enable_url, {}, format="json", **self.auth(self.member)
        )
        self.assertEqual(member_denied.status_code, 403)

        agent_allowed = self.client.post(
            enable_url, {}, format="json", **self.auth(self.agent)
        )
        self.assertEqual(agent_allowed.status_code, 200)

        staff_allowed = self.client.post(
            disable_url, {}, format="json", **self.auth(self.staff)
        )
        self.assertEqual(staff_allowed.status_code, 200)

        member_cancel = self.client.post(
            reverse("agent-cancel", kwargs={"cid": self.room.cid}),
            {},
            format="json",
            **self.auth(self.member),
        )
        agent_cancel = self.client.post(
            reverse("agent-cancel", kwargs={"cid": self.room.cid}),
            {},
            format="json",
            **self.auth(self.agent),
        )
        self.assertEqual(member_cancel.status_code, 403)
        self.assertEqual(agent_cancel.status_code, 204)

    def test_status_requires_room_access_and_guesses_do_not_create_rooms(self):
        status_url = reverse("agent-status", kwargs={"cid": self.room.cid})
        allowed = self.client.get(status_url, **self.auth(self.member))
        denied = self.client.get(status_url, **self.auth(self.outsider))
        anonymous = self.client.get(status_url)

        before = Room.objects.count()
        missing = self.client.get(
            reverse("agent-status", kwargs={"cid": "messaging:guessed-room"}),
            **self.auth(self.staff),
        )

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(anonymous.status_code, 403)
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(Room.objects.count(), before)

    @patch("stream_server_django.chat_addons.agent.views.get_agent_service")
    def test_member_cannot_simulate_or_change_policy(self, service_factory):
        simulate = self.client.post(
            reverse("agent-simulate"),
            {"cid": self.room.cid, "prompt": "expensive"},
            format="json",
            **self.auth(self.member),
        )
        policy = self.client.put(
            reverse("agent-policy"),
            {"cid": self.room.cid, "agent_enabled": False},
            format="json",
            **self.auth(self.member),
        )

        self.assertEqual(simulate.status_code, 403)
        self.assertEqual(policy.status_code, 403)
        service_factory.assert_not_called()

    def test_run_and_memory_operational_data_require_room_control_role(self):
        for route_name in ("agent-runs", "agent-memory"):
            with self.subTest(route_name=route_name):
                url = reverse(route_name) + f"?cid={self.room.cid}"
                member = self.client.get(url, **self.auth(self.member))
                agent = self.client.get(url, **self.auth(self.agent))
                self.assertEqual(member.status_code, 403)
                self.assertEqual(agent.status_code, 200)
