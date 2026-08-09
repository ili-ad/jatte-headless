from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
import threading
from unittest import mock

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from jatte.tests.jwt_factory import make_test_token
from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat_addons.admin_console.services.gating import (
    _schedule_agent_if_enabled,
)
from stream_server_django.chat_addons.agent.models import (
    AgentRoomPolicy,
    AgentRun,
    RoomAgentFlag,
)
from stream_server_django.chat_addons.agent.services.agent_service import (
    AgentOrchestrationResult,
    AgentRoomBusyError,
    AgentService,
    mark_agent_state,
)
from stream_server_django.chat_addons.agent.tasks import run_agent_invocation


User = get_user_model()


@override_settings(ROOT_URLCONF="jatte.urls")
class BackgroundRunTrustTests(TestCase):
    def setUp(self) -> None:
        self.member = User.objects.create_user(
            username="pr12-member", supabase_uid="pr12-member"
        )
        self.outsider = User.objects.create_user(
            username="pr12-outsider", supabase_uid="pr12-outsider"
        )
        self.agent = User.objects.create_user(
            username="pr12-agent", supabase_uid="pr12-agent"
        )
        self.room = Room.objects.create(
            uuid="pr12-room",
            client=self.member.username,
            agent=self.agent,
        )
        self.channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        self.message = Message.objects.create(
            channel=self.channel,
            body="Please help",
            sent_by=self.member.username,
            custom_data={"client_generated_id": "client-pr12-1"},
        )
        self.room.messages.add(self.message)
        RoomAgentFlag.objects.create(room=self.room, agent_enabled=True)
        AgentRoomPolicy.objects.create(
            cid=self.room.cid,
            agent_enabled=True,
            enabled_skills=[],
        )
        self.service = AgentService(llm_client=mock.Mock())
        self.client = APIClient()

    def auth(self, user=None) -> dict[str, str]:
        actor = user or self.member
        return {
            "HTTP_AUTHORIZATION": f"Bearer {make_test_token(actor.supabase_uid)}"
        }

    def make_run(
        self,
        *,
        status: str = AgentRun.STATUS_QUEUED,
        source_message: Message | None = None,
        room: Room | None = None,
    ) -> AgentRun:
        authoritative_room = room or self.room
        source = source_message or self.message
        run = AgentRun.objects.create(
            run_id="00000000-0000-4000-8000-%012d" % (AgentRun.objects.count() + 1),
            cid=authoritative_room.cid,
            user_id=str(self.member.pk),
            room=authoritative_room,
            requested_by=self.member,
            source_message=source,
            input_text=source.body,
            request_meta={"source": "test"},
            idempotency_key=f"test:{authoritative_room.pk}:{source.pk}:{AgentRun.objects.count()}",
            status=status,
            queued_at=timezone.now(),
            started_at=timezone.now() if status == AgentRun.STATUS_RUNNING else None,
        )
        if status in {AgentRun.STATUS_QUEUED, AgentRun.STATUS_RUNNING}:
            authoritative_room.agent_busy = True
            authoritative_room.active_agent_run_id = run.run_id
            authoritative_room.save(
                update_fields=["agent_busy", "active_agent_run_id"]
            )
        return run

    def successful_orchestration(self, calls: dict[str, int]):
        def execute(**kwargs):
            calls["llm"] += 1
            calls["tool"] += 1
            run = kwargs["authoritative_run"]
            message = self.service._persist_run_placeholder(run)
            message.body = "done"
            message.save(update_fields=["body", "updated_at"])
            return AgentOrchestrationResult(
                request_id=run.run_id,
                text="done",
                status=AgentRun.STATUS_OK,
                tools_used=["representative_tool"],
                latency_ms=5,
                tokens_in=3,
                tokens_out=2,
                cost_usd=Decimal("0.000001"),
                reason="ok",
                handoff_triggered=False,
                message=message,
            )

        return execute

    def test_forged_run_id_has_zero_side_effects(self):
        before = (
            Room.objects.count(),
            Channel.objects.count(),
            Message.objects.count(),
            AgentRun.objects.count(),
        )
        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            self.assertFalse(self.service.execute_agent_run("missing-run"))
        self.assertEqual(
            before,
            (
                Room.objects.count(),
                Channel.objects.count(),
                Message.objects.count(),
                AgentRun.objects.count(),
            ),
        )
        orchestrate.assert_not_called()

    @mock.patch(
        "stream_server_django.chat_addons.agent.tasks.get_agent_service"
    )
    def test_legacy_task_accepts_only_run_id(self, service_factory):
        service_factory.return_value.execute_agent_run.return_value = False
        self.assertFalse(run_agent_invocation("opaque-run"))
        service_factory.return_value.execute_agent_run.assert_called_once_with(
            "opaque-run"
        )
        with self.assertRaises(TypeError):
            run_agent_invocation("opaque-run", "messaging:forged", "prompt")

    @mock.patch(
        "stream_server_django.chat_addons.agent.services.agent_service.get_agent_service"
    )
    def test_admin_intake_schedules_the_same_persisted_work_order(
        self, service_factory
    ):
        service = service_factory.return_value
        _schedule_agent_if_enabled(message=self.message, actor=self.agent)
        service.queue_authorized_run.assert_called_once_with(
            room=self.room,
            requested_by=self.agent,
            source_message=self.message,
            input_text=self.message.body,
            request_meta={"source": "intake_approval"},
        )

    def test_source_message_substitution_fails_closed(self):
        room_b = Room.objects.create(uuid="pr12-room-b", client="other")
        channel_b = Channel.objects.create(uuid=room_b.uuid, client="other")
        message_b = Message.objects.create(
            channel=channel_b, body="foreign", sent_by="other"
        )
        room_b.messages.add(message_b)
        run = self.make_run(source_message=message_b)

        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))

        run.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_ERROR)
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)
        orchestrate.assert_not_called()

    def test_disabled_after_queue_fails_without_background_message(self):
        run = self.make_run()
        AgentRoomPolicy.objects.filter(cid=self.room.cid).update(agent_enabled=False)
        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))
        run.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_ERROR)
        self.assertIsNone(run.result_message_id)
        self.assertEqual(Message.objects.count(), 1)
        orchestrate.assert_not_called()

    def test_sequential_duplicate_delivery_runs_llm_and_tool_once(self):
        run = self.make_run()
        calls = {"llm": 0, "tool": 0}
        with mock.patch.object(
            self.service,
            "_orchestrate",
            side_effect=self.successful_orchestration(calls),
        ):
            self.assertTrue(self.service.execute_agent_run(run.run_id))
            self.assertFalse(self.service.execute_agent_run(run.run_id))

        run.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(calls, {"llm": 1, "tool": 1})
        self.assertEqual(run.status, AgentRun.STATUS_OK)
        self.assertEqual(run.attempt_count, 1)
        self.assertEqual(run.cost_usd, Decimal("0.000001"))
        self.assertIsNotNone(run.result_message_id)
        self.assertEqual(
            Message.objects.filter(result_agent_run=run).count(), 1
        )
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)

    def test_terminal_and_cancelled_redelivery_are_noops(self):
        terminal = (
            AgentRun.STATUS_OK,
            AgentRun.STATUS_ERROR,
            AgentRun.STATUS_CANCELLED,
            AgentRun.STATUS_HANDOFF,
            AgentRun.STATUS_CAPPED,
        )
        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            for index, status in enumerate(terminal):
                source = Message.objects.create(
                    channel=self.channel,
                    body=f"terminal-{index}",
                    sent_by=self.member.username,
                )
                self.room.messages.add(source)
                run = self.make_run(status=status, source_message=source)
                self.assertFalse(self.service.execute_agent_run(run.run_id))
        orchestrate.assert_not_called()

    def test_stale_running_redelivery_marks_error_without_replay(self):
        run = self.make_run(status=AgentRun.STATUS_RUNNING)
        AgentRun.objects.filter(pk=run.pk).update(
            started_at=timezone.now() - timedelta(hours=1)
        )
        with self.settings(AGENT_STALE_RUN_SECONDS=60), mock.patch.object(
            self.service, "_orchestrate"
        ) as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))
        run.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_ERROR)
        orchestrate.assert_not_called()

    def test_worker_exception_is_terminal_and_clears_room(self):
        run = self.make_run()
        with mock.patch.object(
            self.service, "_orchestrate", side_effect=RuntimeError("boom")
        ) as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))
            self.assertFalse(self.service.execute_agent_run(run.run_id))
        run.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_ERROR)
        self.assertEqual(orchestrate.call_count, 1)
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)

    def test_final_message_state_does_not_clear_room_before_run_terminal(self):
        run = self.make_run(status=AgentRun.STATUS_RUNNING)
        placeholder = self.service._persist_run_placeholder(run)
        mark_agent_state(
            room=self.room,
            ai_state="AI_STATE_IDLE",
            ai_message=placeholder,
            agent_run=run,
            preserve_active_run=True,
        )
        self.room.refresh_from_db()
        run.refresh_from_db()
        self.assertTrue(self.room.agent_busy)
        self.assertEqual(str(self.room.active_agent_run_id), run.run_id)
        self.assertEqual(run.status, AgentRun.STATUS_RUNNING)

    def test_queue_is_idempotent_and_room_busy_is_atomic(self):
        with mock.patch.object(self.service, "enqueue_generate") as schedule:
            with self.captureOnCommitCallbacks(execute=True):
                first, created = self.service.queue_authorized_run(
                    room=self.room,
                    requested_by=self.member,
                    source_message=self.message,
                    input_text=self.message.body,
                    request_meta={"source": "http"},
                    client_generated_id="same-client-id",
                )
            second, duplicate_created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={"source": "http"},
                client_generated_id="same-client-id",
            )
        self.assertTrue(created)
        self.assertFalse(duplicate_created)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(AgentRun.objects.count(), 1)
        schedule.assert_called_once_with(first.run_id)

        other = Message.objects.create(
            channel=self.channel, body="different", sent_by=self.member.username
        )
        self.room.messages.add(other)
        with self.assertRaises(AgentRoomBusyError):
            self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=other,
                input_text=other.body,
                request_meta={},
            )

    def test_scheduler_failure_marks_run_error_and_clears_busy_state(self):
        with mock.patch.object(
            self.service, "enqueue_generate", side_effect=RuntimeError("scheduler")
        ):
            with self.assertRaises(RuntimeError), self.captureOnCommitCallbacks(
                execute=True
            ):
                self.service.queue_authorized_run(
                    room=self.room,
                    requested_by=self.member,
                    source_message=self.message,
                    input_text=self.message.body,
                    request_meta={},
                )
        run = AgentRun.objects.get()
        run.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_ERROR)
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)

    @mock.patch(
        "stream_server_django.chat_addons.agent.views.get_agent_service"
    )
    def test_duplicate_http_request_returns_same_durable_job(self, service_factory):
        service_factory.return_value = self.service
        url = f"/api/chat/agent/{self.room.cid}/invoke/"
        payload = {
            "room_uuid": self.room.uuid,
            "last_human_message_id": self.message.pk,
            "client_generated_id": "http-retry",
            "trace_id": "trace-pr12",
        }
        with mock.patch.object(self.service, "enqueue_generate") as schedule:
            with self.captureOnCommitCallbacks(execute=True):
                first = self.client.post(
                    url, payload, format="json", **self.auth()
                )
            second = self.client.post(url, payload, format="json", **self.auth())

        self.assertEqual(first.status_code, 202, first.data)
        self.assertEqual(second.status_code, 202, second.data)
        self.assertEqual(first.data["job_id"], second.data["job_id"])
        self.assertEqual(AgentRun.objects.count(), 1)
        schedule.assert_called_once()
        run = AgentRun.objects.get()
        self.assertEqual(run.room, self.room)
        self.assertEqual(run.requested_by, self.member)
        self.assertEqual(run.source_message, self.message)
        self.assertEqual(run.input_text, self.message.body)

    def test_fallback_idempotency_uses_authorized_room_and_message(self):
        with mock.patch.object(self.service, "enqueue_generate"):
            first, _ = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={},
            )
            second, created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={},
            )
        self.assertFalse(created)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(
            first.idempotency_key,
            f"agent:{self.room.pk}:message:{self.message.pk}",
        )

    def test_client_id_then_fallback_retry_uses_same_work_order(self):
        with mock.patch.object(self.service, "enqueue_generate"):
            first, created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={"source": "http"},
                client_generated_id="client-pr12-1",
            )
            first.status = AgentRun.STATUS_OK
            first.finished_at = timezone.now()
            first.save(update_fields=["status", "finished_at", "updated_at"])
            self.room.agent_busy = False
            self.room.active_agent_run_id = None
            self.room.save(update_fields=["agent_busy", "active_agent_run_id"])
            retry, retry_created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={"source": "http"},
            )

        self.assertTrue(created)
        self.assertFalse(retry_created)
        self.assertEqual(retry.pk, first.pk)
        self.assertEqual(AgentRun.objects.count(), 1)
        self.assertEqual(
            first.idempotency_key,
            f"agent:{self.room.pk}:message:{self.message.pk}",
        )
        self.assertEqual(first.request_meta["client_generated_id"], "client-pr12-1")

    def test_fallback_then_client_id_retry_uses_same_work_order(self):
        with mock.patch.object(self.service, "enqueue_generate"):
            first, _ = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={},
            )
            first.status = AgentRun.STATUS_OK
            first.finished_at = timezone.now()
            first.save(update_fields=["status", "finished_at", "updated_at"])
            self.room.agent_busy = False
            self.room.active_agent_run_id = None
            self.room.save(update_fields=["agent_busy", "active_agent_run_id"])
            retry, retry_created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={},
                client_generated_id="client-pr12-1",
            )

        self.assertFalse(retry_created)
        self.assertEqual(retry.pk, first.pk)
        self.assertEqual(AgentRun.objects.count(), 1)

    def test_authoritative_room_source_pair_is_database_unique(self):
        self.make_run(status=AgentRun.STATUS_OK)
        with self.assertRaises(IntegrityError), transaction.atomic():
            AgentRun.objects.create(
                run_id="00000000-0000-4000-8000-999999999999",
                cid=self.room.cid,
                user_id=str(self.member.pk),
                room=self.room,
                requested_by=self.member,
                source_message=self.message,
                input_text=self.message.body,
                request_meta={},
                idempotency_key="alternate-identity",
                status=AgentRun.STATUS_OK,
            )

    def test_distinct_message_can_run_after_prior_terminal_run(self):
        first = self.make_run()
        calls = {"llm": 0, "tool": 0}
        with mock.patch.object(
            self.service,
            "_orchestrate",
            side_effect=self.successful_orchestration(calls),
        ):
            self.assertTrue(self.service.execute_agent_run(first.run_id))

        second_message = Message.objects.create(
            channel=self.channel,
            body="A distinct request",
            sent_by=self.member.username,
        )
        self.room.messages.add(second_message)
        with mock.patch.object(self.service, "enqueue_generate"):
            second, created = self.service.queue_authorized_run(
                room=self.room,
                requested_by=self.member,
                source_message=second_message,
                input_text=second_message.body,
                request_meta={},
            )
        self.assertTrue(created)
        self.assertNotEqual(first.run_id, second.run_id)

    def test_unauthorized_missing_and_disabled_http_requests_have_no_side_effects(self):
        url = f"/api/chat/agent/{self.room.cid}/invoke/"
        payload = {
            "room_uuid": self.room.uuid,
            "last_human_message_id": self.message.pk,
        }
        denied = self.client.post(
            url, payload, format="json", **self.auth(self.outsider)
        )
        missing = self.client.post(
            "/api/chat/agent/messaging:does-not-exist/invoke/",
            {**payload, "room_uuid": "does-not-exist"},
            format="json",
            **self.auth(),
        )
        RoomAgentFlag.objects.filter(room=self.room).update(agent_enabled=False)
        disabled = self.client.post(url, payload, format="json", **self.auth())
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(disabled.status_code, 400)
        self.assertEqual(AgentRun.objects.count(), 0)
        self.assertFalse(Room.objects.filter(uuid="does-not-exist").exists())

    def test_queued_cancellation_prevents_execution(self):
        run = self.make_run()
        response = self.client.post(
            f"/api/rooms/{self.room.cid}/agent/cancel/",
            {},
            format="json",
            **self.auth(self.agent),
        )
        self.assertEqual(response.status_code, 200, response.data)
        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))
        run.refresh_from_db()
        self.room.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_CANCELLED)
        self.assertFalse(self.room.agent_busy)
        self.assertIsNone(self.room.active_agent_run_id)
        self.assertIsNone(run.result_message_id)
        orchestrate.assert_not_called()

    def test_running_cancellation_marks_placeholder_and_prevents_redelivery(self):
        run = self.make_run(status=AgentRun.STATUS_RUNNING)
        placeholder = self.service._persist_run_placeholder(run)
        response = self.client.post(
            f"/api/rooms/{self.room.cid}/agent/cancel/",
            {},
            format="json",
            **self.auth(self.agent),
        )
        self.assertEqual(response.status_code, 200, response.data)
        run.refresh_from_db()
        placeholder.refresh_from_db()
        self.assertEqual(run.status, AgentRun.STATUS_CANCELLED)
        self.assertEqual(placeholder.custom_data["ai_state"], "AI_STATE_ERROR")
        self.assertEqual(placeholder.custom_data["error_reason"], "cancelled")
        with mock.patch.object(self.service, "_orchestrate") as orchestrate:
            self.assertFalse(self.service.execute_agent_run(run.run_id))
        orchestrate.assert_not_called()


class ConcurrentRunClaimTests(TransactionTestCase):
    reset_sequences = True

    def test_concurrent_duplicate_claim_executes_once(self):
        user = User.objects.create_user(username="claim-user", supabase_uid="claim-user")
        room = Room.objects.create(uuid="claim-room", client=user.username)
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        message = Message.objects.create(channel=channel, body="hello", sent_by=user.username)
        room.messages.add(message)
        AgentRoomPolicy.objects.create(cid=room.cid, agent_enabled=True)
        run = AgentRun.objects.create(
            run_id="10000000-0000-4000-8000-000000000001",
            cid=room.cid,
            user_id=str(user.pk),
            room=room,
            requested_by=user,
            source_message=message,
            input_text=message.body,
            request_meta={},
            idempotency_key="concurrent-claim",
            status=AgentRun.STATUS_QUEUED,
            queued_at=timezone.now(),
        )
        room.agent_busy = True
        room.active_agent_run_id = run.run_id
        room.save(update_fields=["agent_busy", "active_agent_run_id"])

        service = AgentService(llm_client=mock.Mock())
        entered = threading.Event()
        release = threading.Event()
        calls = []

        def orchestration(**kwargs):
            calls.append(kwargs["authoritative_run"].run_id)
            entered.set()
            release.wait(timeout=5)
            return AgentOrchestrationResult(
                request_id=run.run_id,
                text="done",
                status=AgentRun.STATUS_OK,
                tools_used=[],
                latency_ms=1,
                tokens_in=1,
                tokens_out=1,
                cost_usd=Decimal("0"),
                reason="ok",
                handoff_triggered=False,
                message=None,
            )

        results = []
        with mock.patch.object(service, "_orchestrate", side_effect=orchestration):
            first = threading.Thread(
                target=lambda: results.append(service.execute_agent_run(run.run_id))
            )
            first.start()
            self.assertTrue(entered.wait(timeout=5))
            second = threading.Thread(
                target=lambda: results.append(service.execute_agent_run(run.run_id))
            )
            second.start()
            second.join(timeout=5)
            release.set()
            first.join(timeout=5)

        self.assertEqual(calls, [run.run_id])
        self.assertEqual(sorted(results), [False, True])
