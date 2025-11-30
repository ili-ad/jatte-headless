# Next → Django API trailing-slash survey

## Overview
- Proxy call sites identified: 40.
- Classification counts: 30 canonical-with-slash, 8 no-slash-at-end, 2 inferred/uncertain.
- Top concerns:
  - Several POST endpoints in `Channel` omit the trailing slash even though Django defines canonical `/api/rooms/.../` paths (e.g., `mark_read`, `archive`, `hide`).【F:src/lib/stream-adapter/Channel.ts†L886-L920】【F:backend/chat/urls.py†L100-L194】
  - Admin queue listing omits a trailing slash while Django exposes `chat/admin/queue/`.【F:src/lib/chat-addons/adminApi.ts†L38-L47】【F:backend/chat_addons/admin_console/urls.py†L13-L15】
  - Token fetchers call `/api/token` without a trailing slash; Django allows both via a regex, so lower risk but worth aligning.【F:src/lib/getChatCreds.ts†L10-L13】【F:backend/jatte/urls.py†L16-L31】

## Likely mismatches
Endpoints that both (a) use POST/DELETE from Next with no trailing slash and (b) map to Django patterns that expect a trailing slash.

| Frontend file | Line | Method | Backend URL template | Classification | Matched Django pattern | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/lib/stream-adapter/Channel.ts` | 890 | POST | `/api/rooms/${uuid}/mark_read` | no-slash-at-end | `api/rooms/<str:room_uuid>/mark_read/`【F:backend/chat/urls.py†L100-L106】 | APPEND_SLASH may reject POST without `/`.【F:src/lib/stream-adapter/Channel.ts†L886-L920】 |
| `src/lib/stream-adapter/Channel.ts` | 914 | POST | `/api/rooms/${uuid}/mark_unread` | no-slash-at-end | `api/rooms/<str:room_uuid>/mark_unread/`【F:backend/chat/urls.py†L104-L107】 | Same risk as above.【F:src/lib/stream-adapter/Channel.ts†L911-L920】 |
| `src/lib/stream-adapter/Channel.ts` | 1300 | POST | `/api/rooms/${uuid}/archive` | no-slash-at-end | `api/rooms/<str:room_uuid>/archive/`【F:backend/chat/urls.py†L171-L174】 | Trailing slash dropped before POST.【F:src/lib/stream-adapter/Channel.ts†L1298-L1305】 |
| `src/lib/stream-adapter/Channel.ts` | 1309 | POST | `/api/rooms/${uuid}/unarchive` | no-slash-at-end | `api/rooms/<str:room_uuid>/unarchive/`【F:backend/chat/urls.py†L175-L178】 | Trailing slash dropped before POST.【F:src/lib/stream-adapter/Channel.ts†L1307-L1314】 |
| `src/lib/stream-adapter/Channel.ts` | 1318 | POST | `/api/rooms/${uuid}/hide` | no-slash-at-end | `api/rooms/<str:room_uuid>/hide/`【F:backend/chat/urls.py†L185-L188】 | Likely 301/RuntimeError without `/`.【F:src/lib/stream-adapter/Channel.ts†L1316-L1324】 |
| `src/lib/stream-adapter/Channel.ts` | 1328 | POST | `/api/rooms/${uuid}/show` | no-slash-at-end | `api/rooms/<str:room_uuid>/show/`【F:backend/chat/urls.py†L189-L194】 | Same issue for show toggle.【F:src/lib/stream-adapter/Channel.ts†L1326-L1333】 |
| `src/lib/chat-addons/adminApi.ts` | 42 | GET | `/api/chat/admin/queue` | no-slash-at-end | `chat/admin/queue/`【F:backend/chat_addons/admin_console/urls.py†L13-L15】 | GET likely 301, but could break fetch if redirects not handled.【F:src/lib/chat-addons/adminApi.ts†L38-L47】 |
| `src/lib/stream-adapter/Channel.ts` | 731 | GET | `/api/rooms/${uuid}/read` | no-slash-at-end | `api/rooms/<str:room_uuid>/read/`【F:backend/chat/urls.py†L119-L123】 | GET may redirect; worth normalizing.【F:src/lib/stream-adapter/Channel.ts†L729-L758】 |

## Full inventory
All discovered frontend calls that ultimately proxy to Django (via Next rewrites or route handlers).

| Frontend file | Line | Method | Backend URL template | Classification | Matched Django pattern (if obvious) |
| --- | --- | --- | --- | --- | --- |
| `src/app/api/rooms/[...path]/route.ts` | 10 | POST | `${BACKEND}/api/rooms/${params.path.join('/')}/` | canonical-with-slash | `api/rooms/<path:cid>/messages/` etc., trailing slash required.【F:src/app/api/rooms/[...path]/route.ts†L6-L21】 |
| `src/lib/api.ts` (apiFetch) | 77-95 | GET/POST/DELETE passthrough | `/api${path}` from caller input | inferred/uncertain | Relies on caller for trailing slash; rewrite sends to Django.【F:src/lib/stream-adapter/ChatClient.ts†L75-L99】【F:src/lib/api.ts†L13-L41】 |
| `src/lib/getToken.ts` | 14 | GET | `/api/token` | no-slash-at-end | `api/token/` + regex without slash.【F:src/lib/getToken.ts†L14-L20】【F:backend/jatte/urls.py†L16-L31】 |
| `src/lib/getChatCreds.ts` | 10 | GET | `/api/token` | no-slash-at-end | `api/token/` + optional regex.【F:src/lib/getChatCreds.ts†L10-L13】【F:backend/jatte/urls.py†L16-L31】 |
| `src/app/AuthBootstrap.tsx` | 12 | GET | `/api/token` | no-slash-at-end | `api/token/` + optional regex.【F:src/app/AuthBootstrap.tsx†L10-L16】【F:backend/jatte/urls.py†L16-L31】 |
| `src/lib/stream-adapter/ChatClient.ts` | 75-99 | GET/POST/DELETE | axiosInstance passthrough (caller-provided paths) | inferred/uncertain | Depends on upstream Stream UI paths.【F:src/lib/stream-adapter/ChatClient.ts†L75-L99】 |
| `src/lib/stream-adapter/ChatClient.ts` | 238 | POST | `/api/dispatch-event/` | canonical-with-slash | Not in URLs file; custom event endpoint (slash retained).【F:src/lib/stream-adapter/ChatClient.ts†L236-L245】 |
| `src/lib/stream-adapter/ChatClient.ts` | 261 | POST | `/api/core-user-agent/` | canonical-with-slash | In `users/core` routes (slash canonical).【F:src/lib/stream-adapter/ChatClient.ts†L258-L268】 |
| `src/lib/stream-adapter/ChatClient.ts` | 301 | GET | `/api/client-id/` | canonical-with-slash | `api/connection-id/` patterns follow trailing slash style.【F:src/lib/stream-adapter/ChatClient.ts†L300-L309】【F:backend/jatte/urls.py†L33-L45】 |
| `src/lib/stream-adapter/ChatClient.ts` | 313 | POST | `/api/sync-user/` | canonical-with-slash | `api/sync-user/` defined with optional slash.【F:src/lib/stream-adapter/ChatClient.ts†L313-L321】【F:backend/accounts_supabase/urls.py†L14-L15】 |
| `src/lib/stream-adapter/ChatClient.ts` | 326 | GET | `/api/ws-auth/` | canonical-with-slash | Regex allows optional slash.【F:src/lib/stream-adapter/ChatClient.ts†L326-L329】【F:backend/jatte/urls.py†L33-L38】 |
| `src/lib/stream-adapter/ChatClient.ts` | 331 | GET | `/api/connection-id/` | canonical-with-slash | Regex allows optional slash.【F:src/lib/stream-adapter/ChatClient.ts†L330-L339】【F:backend/jatte/urls.py†L33-L40】 |
| `src/lib/stream-adapter/ChatClient.ts` | 355 | DELETE | `/api/session/` | canonical-with-slash | Session endpoint follows trailing slash style.【F:src/lib/stream-adapter/ChatClient.ts†L352-L359】 |
| `src/lib/stream-adapter/ChatClient.ts` | 379 | GET | `/api/rooms/` | canonical-with-slash | `api/rooms/` list.【F:src/lib/stream-adapter/ChatClient.ts†L377-L389】【F:backend/chat/urls.py†L88-L93】 |
| `src/lib/stream-adapter/ChatClient.ts` | 393 | GET | `/api/users/` | canonical-with-slash | `users.urls` include trailing slash patterns.【F:src/lib/stream-adapter/ChatClient.ts†L391-L399】 |
| `src/lib/stream-adapter/ChatClient.ts` | 404 | GET | `/api/user/` | canonical-with-slash | User detail follows trailing slash style.【F:src/lib/stream-adapter/ChatClient.ts†L402-L413】 |
| `src/lib/stream-adapter/ChatClient.ts` | 417 | GET | `/api/app-settings/` | canonical-with-slash | App settings endpoints use trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L415-L425】 |
| `src/lib/stream-adapter/ChatClient.ts` | 429 | GET | `/api/notifications/` | canonical-with-slash | Notifications endpoints include trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L427-L436】 |
| `src/lib/stream-adapter/ChatClient.ts` | 440 | GET | `/api/polls/` | canonical-with-slash | `polls.urls` use trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L438-L447】 |
| `src/lib/stream-adapter/ChatClient.ts` | 451 | GET | `/api/reminders/` | canonical-with-slash | `reminders.urls` use trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L449-L458】 |
| `src/lib/stream-adapter/ChatClient.ts` | 462 | GET | `/api/threads/` | canonical-with-slash | Thread endpoint follows trailing slash style.【F:src/lib/stream-adapter/ChatClient.ts†L460-L474】 |
| `src/lib/stream-adapter/ChatClient.ts` | 478 | GET | `/api/muted-users/` | canonical-with-slash | `mutes.urls` include trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L476-L485】 |
| `src/lib/stream-adapter/ChatClient.ts` | 488 | GET | `/api/rooms/active/` | canonical-with-slash | Active rooms list includes trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L487-L494】【F:backend/chat/urls.py†L86-L92】 |
| `src/lib/stream-adapter/ChatClient.ts` | 498 | GET | `/api/muted-channels/` | canonical-with-slash | Muted channels view uses trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L496-L507】 |
| `src/lib/stream-adapter/ChatClient.ts` | 511 | GET | `/api/listeners/` | canonical-with-slash | Listeners endpoint uses trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L509-L517】 |
| `src/lib/stream-adapter/ChatClient.ts` | 521 | GET | `/api/mute-status/${userId}/` | canonical-with-slash | Room mute status path ends with slash.【F:src/lib/stream-adapter/ChatClient.ts†L519-L527】 |
| `src/lib/stream-adapter/ChatClient.ts` | 545 | POST | `/api/rooms/${cid}/mutes/` | canonical-with-slash | `api/rooms/<path:cid>/mutes/`.【F:src/lib/stream-adapter/ChatClient.ts†L545-L551】【F:backend/chat/urls.py†L139-L143】 |
| `src/lib/stream-adapter/ChatClient.ts` | 560 | POST | `/api/user-mutes/unmute/` | canonical-with-slash | Unmute endpoint ends with slash.【F:src/lib/stream-adapter/ChatClient.ts†L553-L567】 |
| `src/lib/stream-adapter/ChatClient.ts` | 644 | POST | `/api/messages/${id}/pin/` | canonical-with-slash | Message pin paths end with slash.【F:src/lib/stream-adapter/ChatClient.ts†L642-L649】 |
| `src/lib/stream-adapter/ChatClient.ts` | 654 | DELETE | `/api/messages/${id}/unpin/` | canonical-with-slash | Message unpin paths end with slash.【F:src/lib/stream-adapter/ChatClient.ts†L652-L659】 |
| `src/lib/stream-adapter/ChatClient.ts` | 663 | POST | `/api/polls/${pollId}/options/` | canonical-with-slash | Poll options path has trailing slash.【F:src/lib/stream-adapter/ChatClient.ts†L661-L673】 |
| `src/lib/stream-adapter/ChatClient.ts` | 677 | GET | `/api/recover-state/` | canonical-with-slash | Recover state endpoint ends with slash.【F:src/lib/stream-adapter/ChatClient.ts†L675-L691】 |
| `src/lib/stream-adapter/ChatClient.ts` | 708 | POST | `/api/subarray/` | canonical-with-slash | Subarray helper path uses slash.【F:src/lib/stream-adapter/ChatClient.ts†L707-L718】 |
| `src/lib/stream-adapter/Channel.ts` | 132 | POST | `/api/link-preview/` | canonical-with-slash | `link-preview/` uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L126-L141】 |
| `src/lib/stream-adapter/Channel.ts` | 160 | GET | `/api/polls/` | canonical-with-slash | Poll list uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L156-L164】 |
| `src/lib/stream-adapter/Channel.ts` | 176 | POST | `/api/polls/${id}/` | canonical-with-slash | Poll detail paths end with slash.【F:src/lib/stream-adapter/Channel.ts†L172-L179】 |
| `src/lib/stream-adapter/Channel.ts` | 206 | POST | `/api/editing-audit-state/` | canonical-with-slash | Editing audit state uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L200-L207】 |
| `src/lib/stream-adapter/Channel.ts` | 419 | POST | `/api/register-subscriptions/` | canonical-with-slash | Register subscriptions uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L412-L424】【F:backend/jatte/urls.py†L33-L38】 |
| `src/lib/stream-adapter/Channel.ts` | 431 | POST | `/api/rooms/${uuid}/draft/` | canonical-with-slash | Draft endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L425-L434】【F:backend/chat/urls.py†L124-L128】 |
| `src/lib/stream-adapter/Channel.ts` | 457 | GET | `/api/rooms/${uuid}/draft/` | canonical-with-slash | Same draft endpoint with slash.【F:src/lib/stream-adapter/Channel.ts†L449-L461】 |
| `src/lib/stream-adapter/Channel.ts` | 515 | GET | `/api/rooms/${uuid}/config-state/` | canonical-with-slash | Config-state ends with slash.【F:src/lib/stream-adapter/Channel.ts†L506-L518】【F:backend/chat/urls.py†L144-L149】 |
| `src/lib/stream-adapter/Channel.ts` | 549 | POST | `/api/quoted-message/` | canonical-with-slash | Quoted message path includes slash.【F:src/lib/stream-adapter/Channel.ts†L542-L550】【F:backend/jatte/urls.py†L23-L32】 |
| `src/lib/stream-adapter/Channel.ts` | 612 | POST | `/api/rooms/${uuid}/draft/` | canonical-with-slash | Draft autosave keeps slash.【F:src/lib/stream-adapter/Channel.ts†L604-L615】 |
| `src/lib/stream-adapter/Channel.ts` | 731 | GET | `/api/rooms/${uuid}/read` | no-slash-at-end | Django expects `/read/`.【F:src/lib/stream-adapter/Channel.ts†L729-L758】【F:backend/chat/urls.py†L119-L123】 |
| `src/lib/stream-adapter/Channel.ts` | 765 | GET | `/api/rooms/${uuid}/messages/` | canonical-with-slash | Messages list uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L763-L788】【F:backend/chat/urls.py†L88-L97】 |
| `src/lib/stream-adapter/Channel.ts` | 789 | GET | `/api/rooms/${uuid}/members/` | canonical-with-slash | Members endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L789-L798】【F:backend/chat/urls.py†L150-L158】 |
| `src/lib/stream-adapter/Channel.ts` | 810 | GET | `/api/rooms/${uuid}/messages/` | canonical-with-slash | Same messages endpoint, trailing slash.【F:src/lib/stream-adapter/Channel.ts†L804-L819】 |
| `src/lib/stream-adapter/Channel.ts` | 831 | GET | `/api/rooms/${uuid}/members/` | canonical-with-slash | Members endpoint trailing slash.【F:src/lib/stream-adapter/Channel.ts†L829-L838】 |
| `src/lib/stream-adapter/Channel.ts` | 890 | POST | `/api/rooms/${uuid}/mark_read` | no-slash-at-end | Django expects `/mark_read/`.【F:src/lib/stream-adapter/Channel.ts†L886-L896】【F:backend/chat/urls.py†L100-L106】 |
| `src/lib/stream-adapter/Channel.ts` | 914 | POST | `/api/rooms/${uuid}/mark_unread` | no-slash-at-end | Django expects `/mark_unread/`.【F:src/lib/stream-adapter/Channel.ts†L911-L920】【F:backend/chat/urls.py†L104-L107】 |
| `src/lib/stream-adapter/Channel.ts` | 1068 | POST | `/api/rooms/${uuid}/messages/` | canonical-with-slash | Message send uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L1065-L1077】 |
| `src/lib/stream-adapter/Channel.ts` | 1132 | PUT | `/api/messages/${id}/` | canonical-with-slash | Message update path ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1129-L1137】【F:backend/chat/urls.py†L195-L199】 |
| `src/lib/stream-adapter/Channel.ts` | 1148 | PATCH | `/api/messages/${id}/` | canonical-with-slash | Message partial update keeps slash.【F:src/lib/stream-adapter/Channel.ts†L1145-L1152】 |
| `src/lib/stream-adapter/Channel.ts` | 1177 | DELETE | `/api/messages/${id}/` | canonical-with-slash | Message delete path includes slash.【F:src/lib/stream-adapter/Channel.ts†L1174-L1180】 |
| `src/lib/stream-adapter/Channel.ts` | 1191 | POST | `/api/messages/${id}/restore/` | canonical-with-slash | Restore endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1189-L1194】【F:backend/chat/urls.py†L200-L208】 |
| `src/lib/stream-adapter/Channel.ts` | 1206 | POST | `/api/messages/${id}/reactions/` | canonical-with-slash | Reactions path uses trailing slash.【F:src/lib/stream-adapter/Channel.ts†L1204-L1211】 |
| `src/lib/stream-adapter/Channel.ts` | 1220 | POST | `/api/messages/${id}/actions/` | canonical-with-slash | Actions endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1218-L1222】 |
| `src/lib/stream-adapter/Channel.ts` | 1234 | POST | `/api/messages/${id}/flag/` | canonical-with-slash | Flag endpoint has trailing slash.【F:src/lib/stream-adapter/Channel.ts†L1232-L1237】 |
| `src/lib/stream-adapter/Channel.ts` | 1244 | POST | `/api/messages/${id}/pin/` | canonical-with-slash | Pin endpoint keeps slash.【F:src/lib/stream-adapter/Channel.ts†L1242-L1246】 |
| `src/lib/stream-adapter/Channel.ts` | 1253 | DELETE | `/api/messages/${id}/unpin/` | canonical-with-slash | Unpin endpoint has trailing slash.【F:src/lib/stream-adapter/Channel.ts†L1251-L1255】 |
| `src/lib/stream-adapter/Channel.ts` | 1262 | GET | `/api/rooms/${uuid}/pinned` | no-slash-at-end | Django exposes `/pinned/`.【F:src/lib/stream-adapter/Channel.ts†L1260-L1267】【F:backend/chat/urls.py†L160-L164】 |
| `src/lib/stream-adapter/Channel.ts` | 1273 | GET | `/api/messages/${id}/reactions/` | canonical-with-slash | Reaction list keeps slash.【F:src/lib/stream-adapter/Channel.ts†L1271-L1278】 |
| `src/lib/stream-adapter/Channel.ts` | 1281 | DELETE | `/api/messages/${id}/reactions/${reactionId}/` | canonical-with-slash | Reaction delete ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1279-L1285】 |
| `src/lib/stream-adapter/Channel.ts` | 1291 | GET | `/api/messages/${id}/replies/` | canonical-with-slash | Replies path includes slash.【F:src/lib/stream-adapter/Channel.ts†L1289-L1295】 |
| `src/lib/stream-adapter/Channel.ts` | 1300 | POST | `/api/rooms/${uuid}/archive` | no-slash-at-end | Django expects `/archive/`.【F:src/lib/stream-adapter/Channel.ts†L1298-L1305】【F:backend/chat/urls.py†L171-L174】 |
| `src/lib/stream-adapter/Channel.ts` | 1309 | POST | `/api/rooms/${uuid}/unarchive` | no-slash-at-end | Django expects `/unarchive/`.【F:src/lib/stream-adapter/Channel.ts†L1307-L1314】【F:backend/chat/urls.py†L175-L178】 |
| `src/lib/stream-adapter/Channel.ts` | 1318 | POST | `/api/rooms/${uuid}/hide` | no-slash-at-end | Django expects `/hide/`.【F:src/lib/stream-adapter/Channel.ts†L1316-L1324】【F:backend/chat/urls.py†L185-L188】 |
| `src/lib/stream-adapter/Channel.ts` | 1328 | POST | `/api/rooms/${uuid}/show` | no-slash-at-end | Django expects `/show/`.【F:src/lib/stream-adapter/Channel.ts†L1326-L1333】【F:backend/chat/urls.py†L189-L194】 |
| `src/lib/stream-adapter/Channel.ts` | 1338 | POST | `/api/rooms/${uuid}/truncate/` | canonical-with-slash | Truncate endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1336-L1343】【F:backend/chat/urls.py†L180-L183】 |
| `src/lib/stream-adapter/Channel.ts` | 1349 | POST | `/api/rooms/${uuid}/cooldown/` | canonical-with-slash | Cooldown endpoint ends with slash.【F:src/lib/stream-adapter/Channel.ts†L1347-L1350】【F:backend/chat/urls.py†L144-L149】 |
| `src/lib/chat-addons/agentApi.ts` | 54 | GET | `/api/chat/agent/${cid}/` | canonical-with-slash | Agent detail paths defined with slash.【F:src/lib/chat-addons/agentApi.ts†L53-L59】 |
| `src/lib/chat-addons/agentApi.ts` | 62 | POST | `/api/chat/agent/${cid}/enable/` | canonical-with-slash | Agent enable endpoint uses slash.【F:src/lib/chat-addons/agentApi.ts†L61-L70】 |
| `src/lib/chat-addons/agentApi.ts` | 73 | POST | `/api/chat/agent/${cid}/disable/` | canonical-with-slash | Agent disable endpoint uses slash.【F:src/lib/chat-addons/agentApi.ts†L72-L81】 |
| `src/lib/chat-addons/agentApi.ts` | 101 | POST | `/api/chat/agent/${cid}/invoke/` | canonical-with-slash | Agent invoke endpoint uses slash.【F:src/lib/chat-addons/agentApi.ts†L83-L109】 |
| `src/lib/chat-addons/agentApi.ts` | 150 | POST | `/api/chat/agent/rag/` | canonical-with-slash | RAG helper uses trailing slash.【F:src/lib/chat-addons/agentApi.ts†L149-L168】 |
| `src/lib/chat-addons/adminApi.ts` | 42 | GET | `/api/chat/admin/queue` | no-slash-at-end | Django expects `queue/`.【F:src/lib/chat-addons/adminApi.ts†L38-L47】【F:backend/chat_addons/admin_console/urls.py†L13-L15】 |
| `src/lib/chat-addons/adminApi.ts` | 52 | POST | `/api/chat/admin/rooms/${cid}/claim/` | canonical-with-slash | Claim path ends with slash.【F:src/lib/chat-addons/adminApi.ts†L50-L59】【F:backend/chat_addons/admin_console/urls.py†L13-L16】 |

## Notes & follow-ups
- High-risk areas: room read/mark/archive/show/hide/unarchive calls in `Channel` and the admin queue endpoint should be normalized to include trailing slashes to avoid APPEND_SLASH POST errors.
- Token fetchers technically work because Django regex allows missing slash, but aligning them would reduce reliance on redirects.
- The axios-like helper in `ChatClient` forwards arbitrary paths; callers need to ensure they include the canonical trailing slash when targeting Django.
