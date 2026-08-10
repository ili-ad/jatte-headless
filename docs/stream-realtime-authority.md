# Stream UI and realtime authority

Jatte has two independent public upstream relationships:

- Stream-derived UI: `libs/stream-chat-shim` → `ili-ad/iliad-stream-chat-react`.
- Generic connection lifecycle: `libs/iliad-realtime` → `@iliad/realtime`.

The Stream-compatible host seam remains `frontend/src/lib/stream-adapter/**`.
Jatte owns authentication and credential refresh, room/CID identity, WebSocket
endpoint and token transport, the `channel.watch` handshake, strict read-only
REST resynchronization, and event-to-Stream-compatible state mapping.
`@iliad/realtime` owns bounded reconnect/backoff, refresh and resync ordering,
socket generations, stale-callback rejection, diagnostics, and teardown.

GetStream upgrades happen in `ili-ad/iliad-stream-chat-react`; generic realtime
upgrades happen in `ili-ad/iliad-realtime`. Realtime changes do not belong in
the Stream fork, and Stream UI upgrades do not belong in `@iliad/realtime`.

## Migration inventory

Before REALTIME-01C-C, `Channel.watch()` owned initial message/member REST
hydration, imported the WebSocket base from the Stream-derived package,
constructed the browser `WebSocket`, sent `channel.watch` from `onopen`, parsed
JSON and applied domain events from `onmessage`, logged `onerror`/`onclose`, and
had no reconnect implementation. Credentials came from `ChatClient.jwt`; the
only approved refresh authority was—and remains—`ChatClient.refreshToken()`.

After the migration, `Channel` still owns initial hydration and domain event
application. The Jatte facade in `jatteRealtime.ts` owns endpoint construction,
credential query transport and the watch handshake. The shared client owns all
generic callbacks, reconnect, generation fencing and teardown.

## Close policy

| Code or event | Current server meaning | Refresh | Reconnect | Terminal evidence |
| --- | --- | --- | --- | --- |
| `1000` | Intentional/normal close | No | No | WebSocket standard and client shutdown |
| `4401` | Missing or rejected JWT, including expiry | Yes | Bounded | `ChatConsumer.connect`; JWT/WS security tests |
| `4408` | Socket frame rate limit exhausted | No | No | `test_ws_rate_limit.py` |
| `1009` | Oversized frame | No | No | `ChatConsumer.receive`; resource-limit test |
| `forbidden` error frame | Room authorization denied | No | No automatic reconnect | `ChatConsumer._send_forbidden`; WS security tests |
| Other abnormal close | Transport/network failure | No | Bounded | Shared default recovery policy |

Reconnect ordering is shared delay → approved refresh → strict authorized GET
resync → replacement socket → one Jatte `channel.watch` frame → connected.
