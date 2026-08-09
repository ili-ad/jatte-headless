"""Frontend-facing agent response contract tests."""

from unittest.mock import Mock, patch

from jatte.tests.jwt_factory import make_test_token
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.agent.models import RoomAgentFlag


User = get_user_model()


@override_settings(ROOT_URLCONF="jatte.urls")
class StreamAgentContractTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="agent-contract-member",
            email="agent-contract-member@example.com",
            supabase_uid="agent-contract-member",
            password="x",
        )
        self.agent = User.objects.create_user(
            username="agent-contract-agent",
            email="agent-contract-agent@example.com",
            supabase_uid="agent-contract-agent",
            password="x",
        )
        self.room = Room.objects.create(
            uuid="agent-contract-room",
            client=self.member.username,
            agent=self.agent,
        )
        channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        self.message = Message.objects.create(
            channel=channel,
            body="Please prepare the contract response",
            sent_by=self.member.username,
        )
        self.room.messages.add(self.message)
        self.flag = RoomAgentFlag.objects.create(
            room=self.room, agent_enabled=True
        )

    def auth(self, user=None):
        actor = user or self.member
        token = make_test_token(actor.supabase_uid, email=actor.email)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_status_contract_is_available_to_room_participant(self):
        response = self.client.get(
            f"/chat/agent/{self.room.cid}/", **self.auth()
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data), {"cid", "agent_enabled", "updated_at"}
        )
        self.assertEqual(response.data["cid"], self.room.cid)
        self.assertIs(response.data["agent_enabled"], True)

    @patch("stream_server_django.chat_addons.agent.views.get_agent_service")
    def test_frontend_invoke_returns_stable_queued_shape(self, service_factory):
        service = Mock()
        service.enqueue_generate.return_value = "job-contract-1"
        service_factory.return_value = service
        response = self.client.post(
            f"/api/chat/agent/{self.room.cid}/invoke/",
            {
                "room_uuid": self.room.uuid,
                "last_human_message_id": self.message.id,
                "trace_id": "trace-contract-1",
            },
            format="json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, 202, response.data)
        self.assertEqual(
            response.data,
            {
                "status": "queued",
                "job_id": "job-contract-1",
                "trace_id": "trace-contract-1",
            },
        )
        service.enqueue_generate.assert_called_once()

    @patch("stream_server_django.chat_addons.agent.views.get_agent_service")
    def test_disabled_agent_error_shape_stays_stable(self, service_factory):
        self.flag.agent_enabled = False
        self.flag.save(update_fields=["agent_enabled", "updated_at"])
        response = self.client.post(
            f"/api/chat/agent/{self.room.cid}/invoke/",
            {
                "room_uuid": self.room.uuid,
                "last_human_message_id": self.message.id,
            },
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data, {"detail": "Agent is disabled for this room."}
        )
        service_factory.assert_not_called()

    def test_room_mismatch_error_shape_stays_stable(self):
        response = self.client.post(
            f"/api/chat/agent/{self.room.cid}/invoke/",
            {
                "room_uuid": "different-room",
                "last_human_message_id": self.message.id,
            },
            format="json",
            **self.auth(),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {"detail": "Room does not match invocation payload."},
        )
