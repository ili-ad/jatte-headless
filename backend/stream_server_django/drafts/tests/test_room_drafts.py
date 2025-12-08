"""Exercise the room-scoped draft persistence endpoints."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402  pylint: disable=wrong-import-position
from django.core.management import call_command  # noqa: E402  pylint: disable=wrong-import-position
from django.urls import reverse  # noqa: E402  pylint: disable=wrong-import-position
from rest_framework.test import APITestCase  # noqa: E402  pylint: disable=wrong-import-position

call_command("migrate", run_syncdb=True, verbosity=0)

from stream_server_django.chat.models import Draft, Room  # noqa: E402  pylint: disable=wrong-import-position


class RoomDraftEndpointsTests(APITestCase):
    """Validate the behaviour of the draft CRUD API."""

    def setUp(self) -> None:
        User = get_user_model()
        self.user = User.objects.create_user(username="author", password="pw")
        self.room = Room.objects.create(uuid="room-1", client=self.user.username)
        self.url = reverse("drafts:room-draft", kwargs={"room_uuid": self.room.uuid})

    def authenticate(self) -> None:
        self.client.force_authenticate(self.user)

    def test_get_returns_null_when_no_draft_exists(self) -> None:
        """Fetching a room draft should yield ``null`` when nothing is saved."""

        self.authenticate()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"draft": None})

    def test_post_creates_and_returns_draft(self) -> None:
        """Persisting text should return the serialized draft payload."""

        self.authenticate()
        payload = {"text": "typing…"}
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 200)
        draft_data = response.data["draft"]
        self.assertEqual(draft_data["text"], payload["text"])
        self.assertIn("updated_at", draft_data)
        self.assertTrue(Draft.objects.filter(room=self.room, user=self.user).exists())

    def test_post_updates_existing_draft(self) -> None:
        """Posting new text should update the persisted draft."""

        self.authenticate()
        first = self.client.post(self.url, {"text": "first"}, format="json")
        second = self.client.post(self.url, {"text": "second"}, format="json")

        self.assertEqual(second.status_code, 200)
        draft = Draft.objects.get(room=self.room, user=self.user)
        self.assertEqual(draft.text, "second")
        self.assertNotEqual(first.data["draft"]["updated_at"], second.data["draft"]["updated_at"])

    def test_delete_clears_persisted_draft(self) -> None:
        """Deleting should remove the draft and return HTTP 204."""

        Draft.objects.create(room=self.room, user=self.user, text="something")
        self.authenticate()

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Draft.objects.filter(room=self.room, user=self.user).exists())

        follow_up = self.client.get(self.url)
        self.assertEqual(follow_up.status_code, 200)
        self.assertEqual(follow_up.data, {"draft": None})

    def test_requires_authenticated_user(self) -> None:
        """The endpoints must reject unauthenticated requests."""

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_rejects_access_for_non_participants(self) -> None:
        """Users without a relationship to the room should receive 403."""

        User = get_user_model()
        outsider = User.objects.create_user(username="outsider", password="pw")
        other_room = Room.objects.create(uuid="room-2", client="other")
        url = reverse("drafts:room-draft", kwargs={"room_uuid": other_room.uuid})

        self.client.force_authenticate(outsider)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_missing_room_returns_404(self) -> None:
        """Requests for unknown rooms should return 404."""

        self.authenticate()
        url = reverse("drafts:room-draft", kwargs={"room_uuid": "missing-room"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_prefixed_room_identifier_is_supported(self) -> None:
        """Stream-style identifiers should resolve to the same room."""

        self.authenticate()
        url = reverse(
            "drafts:room-draft", kwargs={"room_uuid": f"messaging:{self.room.uuid}"}
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"draft": None})
