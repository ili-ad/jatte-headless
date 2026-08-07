# PR5 privileged-route authorization inventory

All paths are relative to the application root. Supabase JWT means the shared
Bearer-token authentication path; service auth means the constant-time checked
`X-Chat-Service-Token` credential configured by
`CHAT_INTERNAL_SERVICE_TOKEN`.

## Agent routes

| Path | View | Before PR5 | Actor and side effects | PR5 policy |
| --- | --- | --- | --- | --- |
| `/api/chat/agent/<cid>/invoke[/]` | `AgentLLMInvokeView` | Any authenticated user | Enqueues an LLM/RAG job and creates agent state | Supabase JWT plus room access; ordinary room participants may invoke because this is the frontend chat action |
| `/api/chat/agent/<cid>/invoke-echo/` | `AgentInvokeView` | Any authenticated user | Creates and broadcasts an agent message | Supabase JWT plus room access |
| `/api/chat/agent/rag/`, `/chat/agent/rag/` | `AgentRagView` | Any authenticated user | Runs synchronous RAG generation and persists replies | Supabase JWT plus room access |
| `/api/rooms/<cid>/agent/cancel/` | `AgentCancelView` | Any authenticated user | Cancels active agent state/run | Room agent or staff/superuser |
| `/chat/agent/<cid>/` | `AgentStatusView` | Any authenticated user | Reads enablement state | Supabase JWT plus room access |
| `/chat/agent/<cid>/enable/`, `/disable/` | `AgentEnableView`, `AgentDisableView` | Any authenticated user | Changes room agent enablement and policy | Room agent or staff/superuser |
| `/chat/agent/policy` | `AgentPolicyView` | Any authenticated user | Reads or changes model/tool/turn/handoff policy | Room agent or staff/superuser |
| `/chat/agent/skills` | `AgentSkillPolicyView` | Any authenticated user | Reads or changes enabled skills | Room agent or staff/superuser |
| `/chat/agent/memory` | `AgentMemoryListView` | Any authenticated user | Exposes room-scoped agent memory | Room agent or staff/superuser |
| `/chat/agent/runs` | `AgentRunListView` | Any authenticated user | Exposes run status, cost, token, and tool data | Room agent or staff/superuser |
| `/chat/agent/simulate` | `AgentSimulateView` | Any authenticated user | Executes a potentially expensive simulation | Room agent or staff/superuser |

The compatibility paths produced by the nested agent URL include use the same
views and therefore inherit the same policy. Agent lookups resolve existing
rooms only; authorization checks never create a guessed room.

## Admin console routes

| Path | View | Before PR5 | Actor and side effects | PR5 policy |
| --- | --- | --- | --- | --- |
| `/chat/admin/queue/` | `AdminQueueView` | Supabase JWT plus staff | Lists operational queue and ownership | Staff/superuser only |
| `/chat/admin/agent-runs/` | `AgentRunDebugView` | Supabase JWT plus staff | Exposes run/debug data | Staff/superuser only |
| `/chat/admin/rooms/<cid>/claim/` | `ClaimRoomView` | Supabase JWT plus staff | Assigns room ownership | Staff/superuser only |
| `/chat/admin/rooms/<uuid>/reset/`, `/reset-new/` | `ResetRoomView`, `ResetNewRoomView` | Supabase JWT plus staff | Deletes room state/messages and may replace a room | Staff/superuser only |
| `/chat/admin/gating-rules/` | `GatingRulesView` | Supabase JWT plus staff | Reads/changes intake policy | Staff/superuser only |
| `/chat/admin/intake/` | `IntakeListView` | Supabase JWT plus staff | Lists gated messages | Staff/superuser only |
| `/chat/admin/intake/<id>/approve/`, `/reject/` | `ApproveIntakeView`, `RejectIntakeView` | Supabase JWT plus staff | Publishes or rejects gated messages | Staff/superuser only |
| `/chat/admin/audit/` | `AuditTrailListView` | Supabase JWT plus staff | Exposes privileged audit records | Staff/superuser only |

Internal service credentials deliberately do not grant admin-console access.

## Notifications and operational routes

| Path | View | Before PR5 | Actor and side effects | PR5 policy |
| --- | --- | --- | --- | --- |
| `/chat/notifications/intake/` | `IntakeSummaryView` | Supabase JWT plus staff | Exposes operational counts | Staff/superuser or internal service |
| `/chat/notifications/oncall/` | `OnCallConfigView` | Supabase JWT plus staff | Reads/changes on-call contact data | Staff/superuser or internal service |
| `/chat/notifications/presence/` | `AdminHeartbeatView` | Supabase JWT plus staff | Changes operational presence state | Staff/superuser or internal service |
| `/chat/notifications/escalate/` | `EscalateRoomView` | Supabase JWT plus staff | Creates notifications and can send SMS/email | Staff/superuser or internal service |

Service requests materialize a reserved non-staff service actor only after the
service token succeeds. Browser JWTs are never treated as service credentials.

## SMS integration routes

| Path | View | Before PR5 | Actor and side effects | PR5 policy |
| --- | --- | --- | --- | --- |
| `/chat/integrations/sms/webhook/` | `SmsWebhookView` | Body HMAC; duplicate IDs returned success | Creates rooms/users/messages, broadcasts, may invoke autoresponse and send consent replies | External provider only: `X-Signature` HMAC-SHA256 over `Base64(raw_body)`, exact-body validation, and 409 replay rejection by inbound `external_id` |
| `/chat/integrations/sms/send/` | `SmsSendView` | Supabase JWT plus staff | Sends provider SMS and creates relay/message state | Staff/superuser or internal service |
| `/chat/integrations/sms/receipt/` | `SmsReceiptView` | Unauthenticated | Changes delivery state and broadcasts updates | Provider body signature or internal service token; only the first transition from pending is accepted |

The repository's provider-v1 signing contract does not include a signed
timestamp, so PR5 does not invent one. It verifies the exact raw body and uses
the provider's unique external ID/status as the replay boundary. Production
startup requires both `SMS_WEBHOOK_SECRET` and
`CHAT_INTERNAL_SERVICE_TOKEN`; missing or placeholder values fail closed.
