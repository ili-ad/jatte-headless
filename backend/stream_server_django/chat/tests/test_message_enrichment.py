from unittest.mock import patch

from stream_server_django.chat.models import Channel, Message, Room
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


@override_settings(ROOT_URLCONF="chat.urls")
class MessageEnrichmentTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u1", password="pw")
        self.other = User.objects.create_user(username="u2", password="pw")
        self.room = Room.objects.create(uuid="room-1", client="client-1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(self.message)

    def _url(self, message=None, room=None):
        target_message = message or self.message
        target_room = room or self.room
        return reverse(
            "room-message-delete",
            kwargs={
                "cid": f"messaging:{target_room.uuid}",
                "message_id": target_message.id,
            },
        )

    @patch("chat.api_views._broadcast_to_cid")
    def test_enrich_with_attachment_broadcasts_update(self, mock_broadcast):
        self.client.force_authenticate(self.user)
        payload = {
            "attachments": [
                {
                    "id": "att_123",
                    "name": "screenshot.png",
                    "url": "https://cdn.example.com/screenshot.png",
                }
            ]
        }

        response = self.client.patch(self._url(), payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.message.refresh_from_db()
        self.assertEqual(self.message.attachments, payload["attachments"])
        mock_broadcast.assert_called_once()
        cid, event = mock_broadcast.call_args[0]
        self.assertEqual(cid, f"messaging:{self.room.uuid}")
        self.assertEqual(event["type"], "message.updated")
        self.assertEqual(event["message"]["attachments"], payload["attachments"])

    @patch("chat.api_views._broadcast_to_cid")
    def test_enrich_with_preview_broadcasts_update(self, mock_broadcast):
        self.client.force_authenticate(self.user)
        payload = {
            "preview": {"url": "https://example.com", "title": "Example"}
        }

        response = self.client.patch(self._url(), payload, format="json")

        self.assertEqual(response.status_code, 200)
        self.message.refresh_from_db()
        self.assertEqual(self.message.preview, payload["preview"])
        mock_broadcast.assert_called_once()
        _, event = mock_broadcast.call_args[0]
        self.assertEqual(event["message"]["preview"], payload["preview"])

    def test_requires_authentication(self):
        response = self.client.patch(
            self._url(),
            {
                "attachments": [
                    {"id": "att", "name": "x", "url": "https://files.example.com/x"}
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_forbids_unauthorized_user(self):
        self.client.force_authenticate(self.other)
        response = self.client.patch(
            self._url(),
            {"preview": {"url": "https://example.com", "title": "Example"}},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_returns_404_for_message_outside_room(self):
        other_room = Room.objects.create(uuid="room-2", client="client-2")
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self._url(room=other_room),
            {"preview": {"url": "https://example.com", "title": "Example"}},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
