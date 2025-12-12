from __future__ import annotations

import json
from types import SimpleNamespace
from uuid import uuid4

import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient

from stream_server_django.rooms.models import Room, Message


@pytest.mark.django_db
class TestRoomsResolveAndMessages:
    """
    Contract tests for:
      - POST /api/rooms/resolve/
      - GET/POST /api/rooms/<room_uuid>/messages/

    These tests intentionally avoid any custom Django setup/migrate calls.
    They assume the test runner has configured Django and created the test DB.
    """

    def _force_auth(self, client: APIClient, *, supabase_uid: str, username: str | None = None):
        """
        Minimal authenticated identity stub.

        We bypass authentication plumbing and set request.user/request.auth by force_authenticate,
        because the contract we care about is:
          - room resolve returns a stable room_uuid and normalized name
          - message POST returns message.user_id populated for guests

        If your project requires auth to flow through DevTokenOrJWTAuthentication end-to-end,
        replace this with a helper that generates a real JWT and passes Authorization headers.
        """
        from rest_framework.test import force_authenticate

        # user-like object
        user = SimpleNamespace(
            is_authenticated=True,
            username=username or "",
        )

        # auth-like object (claims or token). Our code checks request.auth presence.
        auth = {"sub": supabase_uid, "email": f"{supabase_uid}@example.com"}

        force_authenticate(client, user=user, token=auth)

    def test_resolve_normalizes_name_and_preserves_label(self):
        client = APIClient()
        self._force_auth(client, supabase_uid="guest-sub-123", username="")

        # Ensure allowlist includes this label so resolve creates a "public agent room"
        # If your resolve endpoint doesn't require allowlisting, you can drop this.
        if hasattr(settings, "PUBLIC_AGENT_ROOM_SLUGS"):
            # Most implementations treat this as a list; ensure our label is allowed
            settings.PUBLIC_AGENT_ROOM_SLUGS = list(set(settings.PUBLIC_AGENT_ROOM_SLUGS or []) | {"agent-lab"})

        payload = {"label": "  agent-lab  "}
        resp = client.post("/api/rooms/resolve/", data=payload, format="json")
        assert resp.status_code == 200, resp.content

        data = resp.json()
        assert "room_uuid" in data
        assert data["name"] == "agent-lab"  # normalized

        room_uuid = data["room_uuid"]

        # Verify DB stored both raw label and normalized name (if your impl stores them)
        room = Room.objects.get(uuid=room_uuid)
        assert room.data.get("label") == "  agent-lab  "
        assert room.data.get("name") == "agent-lab"
        assert room.data.get("slug") in {"agent-lab", "agent-lab"}  # slugify result

    def test_post_message_sets_user_id_for_guest(self):
        client = APIClient()
        supabase_uid = "guest-sub-999"
        self._force_auth(client, supabase_uid=supabase_uid, username="")

        # Create a room that is owned by this guest identity
        room = Room.objects.create(
            uuid=uuid4(),
            client=supabase_uid,  # important: access control ties room to identity
            data={"label": "agent-lab", "slug": "agent-lab", "name": "agent-lab"},
        )

        # Send a message
        payload = {"text": "hello world", "client_generated_id": "cgid-1"}
        resp = client.post(f"/api/rooms/{room.uuid}/messages/", data=payload, format="json")
        assert resp.status_code == 200, resp.content

        out = resp.json()
        assert "message" in out
        msg = out["message"]

        # user_id should be stable for guests (prefer supabase_uid)
        assert msg["user_id"] in {supabase_uid}  # or your fallback behavior
        assert msg["text"] == "hello world"
        assert msg.get("client_generated_id") == "cgid-1"

        # List messages should include it
        resp2 = client.get(f"/api/rooms/{room.uuid}/messages/")
        assert resp2.status_code == 200, resp2.content
        out2 = resp2.json()
        assert "messages" in out2
        assert len(out2["messages"]) == 1
        assert out2["messages"][0]["text"] == "hello world"
        assert out2["messages"][0]["user_id"] in {supabase_uid}

    def test_guest_cannot_access_other_users_room(self):
        """
        Privacy check: guest A cannot read/post messages in guest B's room.
        """
        client = APIClient()
        self._force_auth(client, supabase_uid="guest-a", username="")

        room = Room.objects.create(
            uuid=uuid4(),
            client="guest-b",
            data={"label": "agent-lab", "slug": "agent-lab", "name": "agent-lab"},
        )

        resp = client.get(f"/api/rooms/{room.uuid}/messages/")
        assert resp.status_code in {403, 404}, resp.content

        resp2 = client.post(f"/api/rooms/{room.uuid}/messages/", data={"text": "nope"}, format="json")
        assert resp2.status_code in {403, 404}, resp2.content
