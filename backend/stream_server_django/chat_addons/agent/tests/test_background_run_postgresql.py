from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from jatte.tests.jwt_factory import make_test_token
from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, AgentRun
from stream_server_django.chat_addons.agent.services.agent_service import (
    AgentOrchestrationResult,
    AgentService,
)


User = get_user_model()


@override_settings(ROOT_URLCONF="jatte.urls")
class PostgreSQLRunLifecycleTests(TransactionTestCase):
    """Exercise corrected nullable-relation locks on PostgreSQL."""

    def setUp(self):
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL locking regression")
        self.member = User.objects.create_user(
            username="postgres-run-member", supabase_uid="postgres-run-member"
        )
        self.agent = User.objects.create_user(
            username="postgres-run-agent", supabase_uid="postgres-run-agent"
        )
        self.room = Room.objects.create(
            uuid="postgres-run-room", client=self.member.username, agent=self.agent
        )
        self.channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        AgentRoomPolicy.objects.create(cid=self.room.cid, agent_enabled=True)
        self.service = AgentService(llm_client=mock.Mock())

    def make_run(self, *, suffix, status):
        source = Message.objects.create(
            channel=self.channel, body=suffix, sent_by=self.member.username
        )
        self.room.messages.add(source)
        run = AgentRun.objects.create(
            run_id=f"20000000-0000-4000-8000-{int(suffix):012d}",
            cid=self.room.cid,
            user_id=str(self.member.pk),
            room=self.room,
            requested_by=self.member,
            source_message=source,
            input_text=source.body,
            request_meta={},
            idempotency_key=f"postgres-lifecycle-{suffix}",
            status=status,
            queued_at=timezone.now(),
            started_at=timezone.now() if status == AgentRun.STATUS_RUNNING else None,
        )
        self.room.agent_busy = True
        self.room.active_agent_run_id = run.run_id
        self.room.save(update_fields=["agent_busy", "active_agent_run_id"])
        return run

    def test_claim_placeholder_completion_and_cancellation(self):
        first = self.make_run(suffix="1", status=AgentRun.STATUS_QUEUED)

        def complete(**kwargs):
            run = kwargs["authoritative_run"]
            placeholder = self.service._persist_run_placeholder(run)
            return AgentOrchestrationResult(
                request_id=run.run_id,
                text="complete",
                status=AgentRun.STATUS_OK,
                tools_used=[],
                latency_ms=1,
                tokens_in=0,
                tokens_out=0,
                cost_usd=Decimal("0"),
                reason="ok",
                handoff_triggered=False,
                message=placeholder,
            )

        with mock.patch.object(self.service, "_orchestrate", side_effect=complete):
            self.assertTrue(self.service.execute_agent_run(first.run_id))
        first.refresh_from_db()
        self.assertEqual(first.status, AgentRun.STATUS_OK)
        self.assertIsNotNone(first.result_message_id)

        second = self.make_run(suffix="2", status=AgentRun.STATUS_RUNNING)
        self.service._persist_run_placeholder(second)
        response = APIClient().post(
            f"/api/rooms/{self.room.cid}/agent/cancel/",
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {make_test_token(self.agent.supabase_uid)}",
        )
        self.assertEqual(response.status_code, 200, response.data)
        second.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(second.status, AgentRun.STATUS_CANCELLED)
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)
