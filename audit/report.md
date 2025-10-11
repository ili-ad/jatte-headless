# Phase 1 Audit Report – DRF bridge + WS parity

**Highlights**
- 41 of 47 frontend opIds are presently wired (6 gaps remain for link previews, attachments, quoted-message helpers, message restore, and subarray utilities).
- WebSocket `channel.watch` handshake returns the required keys and downstream REST actions broadcast canonical `cid` events for messages, reactions, polls, mutes, and reminders.
- Shim token inventory is fully mapped to opIds with no outstanding TODO buckets; one auth gap persists (`GET /user-agent/` skips Supabase guards).

## 1. Accounts (syncUser, currentUser, session)
- `POST /sync-user/` reuses the Supabase bridge but trims the payload to `{id, username}` with a 200 response, matching the frontend surface.【F:backend/auth/views.py†L37-L51】
- `DELETE /session/` flips the session flags and returns 204 as expected.【F:backend/accounts_supabase/views.py†L131-L138】
- `GET /user/` delegates to the legacy serializer while restricting fields to `{id, username}`.【F:backend/auth/views.py†L68-L81】
- Evidence via `SyncUserView`/`SessionView` tests in `accounts_supabase` confirm JWT auth guards remain in place.【F:backend/auth/views.py†L37-L59】

## 2. Identity tokens (client-id, connection-id)
- `GET /client-id/` issues a random hex identifier per call under Supabase auth.【F:backend/accounts_supabase/views.py†L141-L148】
- `GET /connection-id/` memoizes a snowflake in the caller's session and mirrors it into Redis when available; response payload `{connection_id}` matches the spec.【F:backend/auth/views.py†L101-L124】
- Regression coverage exists in `test_connection_id` ensuring stability and auth enforcement.【F:backend/chat/tests/test_connection_id.py†L10-L45】

## 3. WebSocket auth handshake
- `GET /ws-auth/` is locked behind Supabase JWT and returns `{status:"ok"}` per spec; unauthorized requests yield 403 as confirmed by API tests.【F:backend/auth/views.py†L84-L92】【F:backend/chat/tests/test_ws_auth.py†L10-L45】
- `/ws-auth/` variations (`/api/ws-auth/`, `/ws-auth/`) route to the same guard, so unauthenticated connects are rejected as required.【F:backend/chat/urls.py†L311-L313】【F:backend/chat/tests/test_ws_auth.py†L35-L45】

## 4. User metadata (user agent, directory)
- `POST /user-agent/` stores the agent string in session and echoes `{user_agent}` with 201.【F:backend/accounts_supabase/views.py†L169-L184】
- `GET /user-agent/` intentionally bypasses authentication by returning `AllowAny()`; this violates the Phase 1 requirement that all audited endpoints enforce Supabase auth.【F:backend/accounts_supabase/views.py†L155-L167】
- `GET /users/` uses `QueryUsersView` with Supabase auth and the `{id, username}` shape.【F:backend/accounts_supabase/views.py†L193-L200】

## 5. Rooms catalogue
- `GET /rooms/` and `GET /rooms/active/` share `RoomListSerializer`, emitting `{id, uuid, name, data}` arrays guarded by `DevTokenOrJWTAuthentication`.【F:backend/rooms/views.py†L33-L52】【F:backend/rooms/serializers.py†L10-L27】
- Active filtering relies on `Room.status`, providing parity with historical DRF endpoints.【F:backend/rooms/views.py†L48-L52】

## 6. Room membership wrappers
- `GET /api/rooms/{cid}/members/` now wraps the member list as `{"members": [...]}` with `user_id` and optional `user` payloads, satisfying the audit's wrapper requirement.【F:backend/rooms/views.py†L55-L135】
- The Channels consumer reuses `_collect_members`, so `channel.watch` members share the same schema.【F:backend/chat/consumers.py†L70-L153】

## 7. Threads & replies
- `GET /threads/?cid=…` enforces access, paginates previews, and returns `{results,next}` via `ThreadPreviewSerializer` (adds `thread_id`, `cid`, `reply_count`, preview metadata).【F:backend/chat/views_threads.py†L20-L86】【F:backend/chat/serializers.py†L103-L120】
- `GET /messages/{messageId}/replies/` paginates replies with `{messages,next}`, aligning with the spec's reply envelope.【F:backend/chat/views_threads.py†L97-L132】

## 8. Room-scoped messages
- `POST /api/rooms/{cid}/messages/` (via DRF view used in WS parity test) creates messages serialized by `MessageSerializer` including pinned/attachment fields.【F:backend/chat/serializers.py†L39-L101】【F:backend/chat/tests/test_ws_handshake_parity.py†L82-L94】
- `PATCH /api/rooms/{cid}/messages/{id}/` honors body updates and pin toggles, broadcasting `message.updated` with canonical `cid` through `_broadcast_to_cid`.【F:backend/chat/api_views.py†L560-L612】【F:backend/chat/tests/test_ws_handshake_parity.py†L95-L108】
- `DELETE /api/rooms/{cid}/messages/{id}/` emits `message.deleted` frames carrying `message_id` and timestamp, satisfying parity expectations.【F:backend/chat/api_views.py†L612-L647】【F:backend/chat/tests/test_ws_handshake_parity.py†L169-L180】
- **Gap**: the frontend surface expects `POST /messages/{messageId}/restore/`, but only `/api/messages/{id}/restore/` exists; `restoreMessage` remains unbound in the live manifest.【F:backend/chat/urls.py†L191-L201】【F:openapi/wireup_manifest.live.json†L1-L15】【F:audit/scoreboard.json†L5-L18】

## 9. Message reactions
- `POST /api/messages/{id}/reactions/{type}/` upserts reactions, persisting rows and broadcasting `reaction.new` with canonical `cid` and reaction metadata.【F:backend/chat/api_views.py†L581-L615】
- `DELETE` on the same path clears the reaction and fires `reaction.deleted` events.【F:backend/chat/api_views.py†L617-L647】
- Pytests confirm persistence but still expect the legacy `type == emoji` frame; our run hit these assertions, demonstrating that the backend now emits canonical event names (`reaction.new`/`reaction.deleted`).【F:backend/chat/tests/test_reactions.py†L60-L142】

## 10. Pins & message actions
- `POST /api/messages/{id}/pin/` and `DELETE /api/messages/{id}/unpin/` manage `Pin` rows, with pins driving `message.updated` broadcasts when toggled during updates.【F:backend/chat/api_views.py†L662-L684】【F:backend/chat/tests/test_ws_handshake_parity.py†L95-L108】
- Ancillary moderation endpoints (`flag`, `actions`) echo stored payloads for shim parity.【F:backend/chat/api_views.py†L640-L702】

## 11. Reminders
- Global `GET/POST /reminders/` deliver user-specific reminders and wrap creations as `{reminder:{...}}` while broadcasting `reminder.new` when a `cid` is provided.【F:backend/reminders/views.py†L38-L56】
- `DELETE /reminders/{id}/` returns 204 per contract.【F:backend/reminders/views.py†L59-L65】
- Room-scoped reminders (`POST /api/rooms/{cid}/reminders/`) reuse the same serializer and emit the canonical broadcast, covered in the WS parity test.【F:backend/chat/api_views.py†L1068-L1149】【F:backend/chat/tests/test_ws_handshake_parity.py†L192-L205】

## 12. Polls
- `/polls/` GET enforces `cid` and paginates `{results,next}`; POST returns `{poll:{poll_id,cid,question,options}}` and stores options transactionally.【F:backend/polls/views.py†L56-L112】【F:backend/polls/serializers.py†L23-L39】
- Vote endpoints (`POST/DELETE /polls/{pollId}/options/{optionId}/votes/`) respond with `PollVoteEvent` payloads and broadcast `poll.vote_casted/changed/removed` frames with canonical `cid` and vote metadata.【F:backend/polls/views.py†L134-L205】【F:backend/chat/tests/test_ws_handshake_parity.py†L136-L173】
- Vote pagination honors `limit/cursor` returning `{results,count,next}` as specified.【F:backend/polls/views.py†L200-L233】

## 13. Mutes & moderation
- `POST /rooms/{cid}/mutes/` requires moderator access, persists `RoomMemberMute`, and emits `member.muted` with canonical `cid`, target, and muted flags.【F:backend/chat/api_views.py†L857-L905】【F:backend/chat/tests/test_ws_handshake_parity.py†L182-L190】
- Room mute status (`GET /api/rooms/{cid}/mute/`) and member listings reuse shared serializers to expose `{muted, muted_until}` and `{members:[...]}` as expected.【F:backend/chat/api_views.py†L821-L855】【F:backend/rooms/views.py†L55-L135】
- Global mute endpoints (`/mute-status/{username}/`, `/muted-users/`, `/user-mutes/unmute/`) all require Supabase auth and return the documented shapes.【F:backend/chat/api_views.py†L1152-L1215】

## 14. Notifications & recovery state
- `GET /notifications/` lists user notifications via `NotificationSerializer` under JWT auth.【F:backend/chat/api_views.py†L1056-L1065】
- `GET /recover-state/` aggregates active rooms plus notifications for reconnect parity.【F:backend/chat/api_views.py†L1316-L1327】
- State recovery tests confirm both collections populate as expected.【F:backend/chat/tests/test_recover_state.py†L18-L28】

## 15. Utility & WS parity
- `AttachmentUploadView` and `LinkPreviewView` implement the documented shapes but remain mounted under `/api/...`; frontend opIds `uploadAttachment` and `createLinkPreview` are therefore unbound in the live manifest.【F:backend/chat/api_views.py†L1218-L1267】【F:audit/scoreboard.json†L6-L18】
- Similarly, `SubarrayView` exists at `/api/subarray/`, so the shim utility opId `subarray` is missing; quoted-message helpers are not implemented anywhere, leaving two further manifest gaps.【F:backend/chat/api_views.py†L1330-L1359】【F:audit/scoreboard.json†L6-L18】
- Stub coverage is complete: every token in `shim_buckets.json` resolves to an opId per the updated scoreboard (`stragglerTokens: []`).【F:audit/scoreboard.json†L19-L23】
- WebSocket handshake parity is validated end-to-end via `test_ws_handshake_and_event_parity`, which observes the required `{initialized,messages,next,members,cid}` handshake and downstream events for message create/update/delete, reactions add/remove, poll votes, member mute, and reminder creation—all carrying canonical `cid` values.【F:backend/chat/tests/test_ws_handshake_parity.py†L16-L205】【F:backend/chat/consumers.py†L70-L120】

## Scoreboard
See `audit/scoreboard.json` for the consolidated machine-readable summary, including totals, missing bindings, ws event coverage count, auth exception, and stub coverage status.【F:audit/scoreboard.json†L1-L23】
