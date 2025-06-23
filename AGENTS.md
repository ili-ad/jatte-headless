0 · Recap of current behaviour
Front-end call	HTTP result	Why it fails
GET /api/rooms/messaging:general/messages/	404	URL matches the route, but the view can’t find a Room(uuid="messaging:general"), so get_object_or_404 returns 404.
POST /api/rooms/messaging:general/messages/	405	RoomMessageListCreateView was changed to ListAPIView in the last merge, so POST is no longer allowed.
GET /api/rooms/messaging:general/members/	404	Same “room row doesn’t exist” problem.
GET /api/rooms/messaging:general/config/	404	RoomConfigView looks up the room by cid, doesn’t find it, returns 404.
POST /api/rooms/general/draft
(no trailing slash)	404	Our route ends with /draft/ so the no-slash variant misses; DRF never auto-redirects a POST.

All other calls (token, ws-auth, connection-id, etc.) are working, so auth and WebSocket setup are fine.
1 · Ticket: Normalise trailing-slash policy

Problem: We already hit one mismatch (/draft). More will surface as the UI widens.

Fix options (pick one and do it repo-wide):

    Keep slashes – add no-slash duplicates only where Stream calls them.

path("api/rooms/<str:room_uuid>/draft", RoomDraftView.as_view()),  # duplicate

Remove slashes globally – set in settings.py

    APPEND_SLASH = False
    REST_FRAMEWORK = {"DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
                      "URL_FORMAT_OVERRIDE": None,
                      "DEFAULT_TRAILING_SLASH": ""}  # DRF 3.15+

    Then drop the trailing slash from every urlpatterns entry (search-and-replace).

    Deliverable: one PR that chooses a policy and makes every route + test + front-end call consistent.

2 · Ticket: Auto-create room records on first touch

Stream’s client will happily hit /rooms/<cid>/… before we have a local row.
Return 200 instead of 404 by materialising the room on demand.

class RoomFromCIDMixin:
    def get_room(self, cid: str) -> Room:
        room, _ = Room.objects.get_or_create(uuid=cid, defaults={"client": "stream"})
        return room

Use that mixin in RoomMessageListCreateView, RoomMembersView, RoomConfigView, etc.
3 · Ticket: Re-enable POST on /messages/

RoomMessageListCreateView must inherit ListCreateAPIView (or override post).
Right now it only allows GET → 405.
4 · Ticket: README patch (terminology)

Add this to the glossary section:

• message  – persisted chat content, persisted via POST /rooms/<room_uuid>/messages/
• draft    – per-user unsent message for a room, POST /rooms/<room_uuid>/draft/
• POST     – HTTP verb, not a “post” model

Acceptance-test script (can be curl or pytest)

    GET /api/rooms/messaging:general/config/ -> 200 json

    POST /api/rooms/messaging:general/messages/ {"body":"hi"} -> 201

    POST /api/rooms/messaging:general/draft/ {"text":"draft"} -> 200

    GET /api/rooms/messaging:general/members/ -> 200 list

If all four pass, the React side stops throwing “getConfig failed” / “sendMessage failed”.

Feel free to forward this verbatim to the contractor. It gives them a ranked checklist instead of a wall of logs.