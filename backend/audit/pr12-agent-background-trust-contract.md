# PR12 agent background trust contract

## Entry-point inventory

| Path | Caller and authorization | Pre-PR12 background authority | Executor / reachability | PR12 contract |
|---|---|---|---|---|
| `AgentLLMInvokeView` | Authenticated room participant; existing room access and enabled-agent checks | Canonical CID, requester ID, source text, metadata, and trace ID crossed into a daemon thread | `AgentService.enqueue_generate()` → thread → `generate()`; active frontend path | HTTP creates the authorized `AgentRun`; thread receives only `run_id` |
| Admin intake approval | Staff/internal admin approval of an existing `MessageIntake` | `run_id`, CID, prompt, and metadata passed to `run_agent_invocation.delay()` | Reachable from `approve_intake()` when the room agent flag is enabled | Approval resolves the room from the persisted message/channel relationship and queues the same persisted work order |
| `run_agent_invocation` | Broker/Celery-compatible task; no request principal at execution time | Raw task arguments were sufficient to generate messages and create Channel/Room rows | Actively referenced by admin intake before PR12; retained as compatibility entry point | Signature is `run_agent_invocation(run_id)` and delegates to the canonical executor |
| `AgentService` daemon thread | Internal scheduler after an authorized request commits | Separate random job ID plus raw CID/user/text/meta | Active executor retained | Thread target is `execute_agent_run(run_id)` only |
| `AgentRagView` | Authenticated, room-authorized synchronous compatibility request | No asynchronous boundary | Synchronous and active | Unchanged; it is not a background entry point |
| Simulation/eval/admin simulation | Staff/test/operator-controlled synchronous execution | Explicit simulation input | Synchronous and non-persisting where designed | Unchanged; it cannot be delivered by a broker/thread |

Frontend `invokeAgent` sends the persisted source message ID, room UUID,
`client_generated_id`, and trace ID to the authenticated HTTP boundary. The
HTTP response remains `{status: "queued", job_id, trace_id}`, but `job_id` is
now the durable `AgentRun.run_id`.

## Persisted authority

New runs persist the existing `Room`, authenticated requester, existing source
human `Message`, canonical room CID snapshot, input snapshot, sanitized
server-built request metadata, idempotency key, lifecycle timestamps/attempts,
and the unique result `Message`. No bearer/session credential is stored.

Historical `AgentRun` rows are retained unchanged. New relationship and work
order fields are nullable so migrations do not infer authority from historical
CID strings. There is no CID-based backfill, no room creation, and no run
deletion. Production row counts were unavailable from this checkout; operators
may report the non-sensitive inventory after deployment with:

```python
from stream_server_django.chat_addons.agent.models import AgentRun
print({
    "total": AgentRun.objects.count(),
    "authoritative": AgentRun.objects.filter(room__isnull=False, source_message__isnull=False).count(),
    "legacy": AgentRun.objects.filter(room__isnull=True).count(),
})
```

## Idempotency and state machine

The canonical work-order identity is `(room, source_message)`, represented by
`agent:<room-pk>:message:<message-pk>` and enforced by a conditional database
uniqueness constraint. A validated `client_generated_id` is retained only as
request metadata and does not alter work-order identity. Retries with or without
the client ID therefore resolve to the same persisted run. A duplicate request
returns that run before the room-busy check; a distinct message is eligible
after the prior run terminates.

Inside one transaction the Room row is locked, the idempotent run is found or
created as `queued`, and `agent_busy`/`active_agent_run_id` are set to that run.
Scheduling occurs through `transaction.on_commit`. Scheduler failure marks the
queued run `error` and clears the matching room state.

The worker locks the run and claims only `queued → running`, increments
`attempt_count`, and validates all persisted relationships before orchestration.
Missing, terminal, cancelled, or already-running delivery is a no-op. A stale
running redelivery (15 minutes by default, configurable with
`AGENT_STALE_RUN_SECONDS`) is marked `error` and its room state is cleared; it
is never replayed automatically because tool side effects may be uncertain.

## Result, cancellation, and cleanup

After a successful claim, placeholder creation uses the persisted source
message's existing Channel and Room. It performs no `get_or_create()` and
stores the placeholder in the run's one-to-one `result_message`. The run ID is
included in message agent metadata. Duplicate delivery cannot create another
placeholder because it cannot claim the run.

Queued cancellation marks the authoritative active run cancelled, clears room
busy/active state, and makes later delivery a no-op. Running cancellation uses
the same run ID and result placeholder; streaming cancellation checks that run
status. Success, capped, handoff, error, cancellation, scheduler failure, and
executor exceptions all use conditional cleanup that clears the room only when
the run still owns `active_agent_run_id`.
