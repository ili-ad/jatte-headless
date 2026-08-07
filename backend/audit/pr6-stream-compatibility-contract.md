# PR6 Stream compatibility contract

## Contract boundary

JATTE-headless implements only the subset of Stream Chat used by the JATTE
frontend. It is not a general Stream Chat server. Successful payloads below are
public compatibility contracts; PR1-PR5 authorization remains a prerequisite
and is not weakened by an alias or a compatibility response.

`frontend/src/lib/api.ts` prefixes adapter paths with `/api`. Consequently an
adapter constant such as `/rooms/` calls `/api/rooms/`. The lower-level search
shim deliberately keeps `/search/messages/` relative, while the composer
attachment manager deliberately calls the root `/attachments/` alias. The
production `jatte.urls` includes `stream_server_django.chat_api.urls` first so
the canonical API views win over older lightweight routes; historical aliases
remain available.

Room access is the policy documented in `backend/SECURITY.md`. Inaccessible
authenticated requests return 403, missing objects return 404, and missing or
invalid bearer authentication fails under PR1. Consumers must not infer room
existence from counts, cursors, members, search results, or attachment metadata.

## Frontend call inventory

| Frontend caller | Backend route | Method | Auth | Request and successful response used by the caller | Route status |
| --- | --- | --- | --- | --- | --- |
| `ChatClient.connectUser` | `/api/client-id/`, `/api/sync-user/`, `/api/ws-auth/`, `/api/connection-id/`, `/api/session/` | GET/POST/DELETE | bearer | IDs plus the synchronized user; WS auth returns the legacy URL and `expires`; connection is `{connection_id}` | canonical |
| Token/bootstrap helpers | `/api/token/`, `/api/get-client/`, `/api/state/`, `/api/init-state/`, `/api/recover-state/` | GET | bearer | `{userID,userToken}`, `{client}`, state envelopes, and composer defaults | canonical |
| `ChatClient.queryChannels` | `/api/rooms/`, `/api/rooms/active/`, `/api/rooms/<uuid>/` | GET | bearer + room access for detail | room fields include `uuid,cid,type,name,client,agent,messages,visible,status` | canonical |
| Room bootstrap | `/api/rooms/resolve/` | POST | bearer | `{label}` -> `{room_uuid,name}`; repeated resolution is stable per user/label | canonical |
| `Channel.query` / `Channel.watch` | `/api/rooms/<uuid-or-cid>/messages/` | GET | bearer + room access | `{messages,next}`; message fields include `id,text,body,sent_by,created_at,attachments,parent_id,pinned` | canonical |
| `Channel.sendMessage` | `/api/rooms/<uuid-or-cid>/messages/` | POST | bearer + send access | composer message fields -> full message object, not a nested `{message}` envelope | canonical |
| message edit/delete/restore | `/api/messages/<id>/`, `/api/messages/<id>/restore/`, `/api/messages/<id>/hide/` | GET/PUT/DELETE/POST | bearer + parent-room access + mutation role | full message for get/update/delete/restore; hide returns `{status,message}` | canonical |
| `Channel.getReplies` | `/api/messages/<id>/replies/` | GET | bearer + parent-room access | `{messages,next}` | canonical |
| compatibility reply caller | `/messages/<id>/replies/` | GET | same | same envelope | alias |
| `ChatClient.getThreads` | `/api/threads/` | GET | bearer + CID room access | `{results,next}` with `thread_id,cid,root_message,reply_count` | canonical |
| compatibility thread caller | `/threads/` | GET | same | same envelope | alias |
| member hydration | `/api/rooms/<uuid>/members/` | GET | bearer + room access | UUID form returns a list with `id` | canonical UUID form |
| member query compatibility | `/api/rooms/<cid>/members/` | GET | bearer + room access | `{members}`; supports `limit,offset`; entries contain `user_id,role,banned` and optional `user` | canonical CID form |
| `Channel.read` / mark read | `/api/rooms/<uuid>/read/`, `mark_read/`, `mark_unread/`, `count_unread/`, `last_read/` | GET/POST | bearer + room access | current-user read rows; `{status}`, `{unread}`, and `{last_read}` | canonical |
| composer draft/config | `/api/rooms/<uuid>/draft/`, `/api/rooms/<uuid>/config-state/`, `/api/rooms/<cid>/config/`, `/api/rooms/<uuid>/cooldown/` | GET/POST/DELETE | bearer + room access | draft list/status; config-state has `config.composer`, `config.ai`, `has_ai_assistant`; basic config is `{name,type,muted}`; cooldown fields remain numeric | canonical |
| composer helpers | `/api/text-composer/`, `/api/compose/`, `/api/has-sendable-data/`, `/api/composition-is-empty/` | POST | bearer | `{text}`, `{composition}`, `{has_sendable_data}`, `{is_empty}` | canonical |
| reactions | `/api/messages/<id>/reactions/`, `/api/messages/<id>/reactions/<type>/` | GET/POST/DELETE | bearer + parent-room access | reaction list/object; typed operation returns `{status,message_id,type}` and is idempotent | canonical |
| flags/pins/actions | `/api/messages/<id>/flag/`, `pin/`, `unpin/`, `actions/` | POST/DELETE | bearer + parent-room access; pin/action require room admin | `{flag}`, `{pin}`, 204, `{action}` | canonical |
| message search shim | `/search/messages/` | GET | bearer; results filtered to accessible rooms | `{results,next}` with `id,text,user_id,created_at,cid`; no cross-room total count is exposed | root canonical |
| `Channel.getConfigState` | `/api/rooms/<uuid>/config-state/` | GET | bearer + room access, except explicit public config-state carve-out | composer and AI configuration only | canonical |
| composer legacy upload | `/attachments/` | POST | bearer | `{attachment}` placeholder retaining `id,name,filename,url,scan_status`; never a downloadable blob | frontend alias |
| attachment clients | `/api/attachments/`, `/api/attachments/sign/`, `/api/attachments/commit/`, `/api/attachments/<id>/download/` | POST/GET | bearer + PR4 room/message binding | legacy metadata, signed PUT envelope, `{attachment}`, then private redirect for clean attachments | canonical |
| attachment compatibility | `/attachments/sign/`, `/attachments/commit/` | POST | same | same successful shapes | aliases |
| `invokeAgent` | `/api/chat/agent/<cid>/invoke/` | POST | bearer + room access | invocation -> 202 `{status:"queued",job_id,trace_id}` | canonical |
| `requestAgentReply` | `/api/chat/agent/rag/` | POST | bearer + room access + enabled agent | `{messages,reason}` | canonical |
| agent status/control | `/chat/agent/<cid>/`, `enable/`, `disable/` | GET/POST | bearer; control requires room agent/staff | `{cid,agent_enabled,updated_at}` | root compatibility |

The frontend also calls room archive/unarchive/hide/show, pinned messages,
notifications, polls, reminders, mutes, link previews, editing audit state, and
subscription helpers. These retain their existing route and successful fields;
they are outside the minimum PR6 fixture set when Stream UI does not inspect
their response beyond success.

## WebSocket contract

Both `/ws/<cid>/?token=<jwt>` and the intentional generic
`/ws/chat/?token=<jwt>` route use the same consumer. Authentication succeeds
before acceptance. The generic route selects a room only through an authorized
`channel.watch`; a room-specific route rejects a different payload CID.

| Direction | Event | Required public fields |
| --- | --- | --- |
| server -> client | connection acknowledgement | `{type:"user.join",user}` |
| client -> server | watch | `{type:"channel.watch",cid}` |
| server -> client | initialized | `type,cid,initialized,messages,next,members` |
| server -> client | new/update | `type,cid,message`; message uses the REST message subset |
| server -> client | delete | `type,cid,message_id,deleted_by,ts` |
| both | typing start/stop | `type,cid,user_id` |
| server -> client | read | `type,cid,user,created_at`; `user` includes `id,channel_last_read_at,channel_unread_count` |

REST message creation is the frontend's normal send path. Its channel-layer
broadcast supplies the nested `message` used by `Channel.onmessage`. The
consumer's direct `message.new` input remains a compatibility operation, but
does not replace that REST contract.

## Pagination and errors

- Message and reply pagination uses `before`; responses always retain
  `{messages,next}` and cursors are re-authorized against the requested room.
- Search uses `before` and retains `{results,next}`.
- Threads use `cursor` and retain `{results,next}`.
- CID members use `limit` and `offset` inside `{members}`.
- Variable timestamps, generated IDs, and optional fields are intentionally
  asserted as public subsets rather than full-payload equality.
- Frontend-dependent validation errors retain a JSON `detail` field. Agent
  disabled and room-mismatch responses retain their current `detail` strings.
- Security denials stay 403/404 or WebSocket `forbidden`, `not_watched`, and
  `cid_mismatch`; compatibility aliases do not bypass those checks.
