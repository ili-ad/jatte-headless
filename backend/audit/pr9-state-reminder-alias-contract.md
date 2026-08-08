# PR9 state and reminder alias contract

## Effective production routes

All results below use `ROOT_URLCONF="jatte.urls"`.

| Route | Effective view | Caller/status | Successful shape | Authorization |
| --- | --- | --- | --- | --- |
| `/recover-state/` | `state.views.recover_state` | Root compatibility route; no active frontend caller found | `{stream_server_django.rooms: [{id, uuid, name, data}], notifications: [{type, payload, ts}]}` | Active rooms from `rooms_accessible_to_user`; notifications for the authenticated user |
| `/api/recover-state/` | `chat.api_views.RecoverStateView` | Canonical frontend `ChatClient.recoverStateOnReconnect` call | `{stream_server_django.rooms: RoomSerializer[], notifications: NotificationSerializer[]}` | Active rooms from `rooms_accessible_to_user`; notifications for the authenticated user |
| `/reminders/` | `reminders.views.ReminderListCreateView` | Root compatibility route; `API.REMINDERS` reaches `/api/reminders/` through `apiFetch` | GET list / POST `{reminder}` using compatibility fields | User-owned list; optional room target resolves an existing room and requires access before save/broadcast |
| `/api/reminders/` | `chat.api_views.ReminderListCreateView` | Canonical frontend reminder endpoint | GET list / POST canonical reminder object | User-owned list; POST CID resolves an existing accessible room before save/broadcast |
| `/api/rooms/<cid>/reminders/` | `chat.api_views.RoomReminderCreateView` | Canonical room-targeted shim call | canonical reminder object | Existing room and room access required before save/broadcast |

The two recovery responses deliberately retain their existing serializer shapes;
their effective authorized active-room set is now identical. With Django
`APPEND_SLASH`, `/recover-state` and `/api/recover-state` redirect to their
trailing-slash forms, which are the views above. Compatibility `/reminders`
and `/reminders/` are both accepted explicitly.

## Compatibility reminder CID consumers

The compatibility `stream_server_django.reminders.models.Reminder.cid` is read
only during the POST request that creates a row and emits `reminder.new`.
Repository search found no scheduler, background job, notification delivery,
read/list path, or later broadcaster consuming stored compatibility CIDs.
Listing omits CID from `ReminderOut`, and deletion is user-scoped and emits no
event.

Historical compatibility CIDs therefore remain unchanged as untrusted inert
data. They are never rebroadcast by reading/listing. Any new room-targeted
creation resolves the existing room, proves owner access, saves the canonical
room-derived CID, and broadcasts only to that canonical group. No migration or
automatic historical adjudication is performed.
