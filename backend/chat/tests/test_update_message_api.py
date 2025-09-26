from unittest.mock import AsyncMock, patch

from chat.models import Channel, Message, Room
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


@override_settings(ROOT_URLCONF="chat.urls")
class UpdateMessageAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u1", password="pw")
        self.agent = User.objects.create_user(username="agent", password="pw")
        self.room = Room.objects.create(uuid="room-1", client="client-1")
        self.channel = Channel.objects.create(
            uuid=self.room.uuid,
            client=self.room.client,
        )
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(self.message)

    def _url(self) -> str:
        return reverse(
            "room-message-delete",
            kwargs={
                "cid": f"messaging:{self.room.uuid}",
                "message_id": self.message.id,
            },
        )

    def test_author_can_update_message(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self._url(), {"text": "updated"}, format="json"
        )
        self.assertEqual(response.status_code, 200)

        self.message.refresh_from_db()
        self.assertEqual(self.message.body, "updated")

        self.assertEqual(response.data["id"], self.message.id)
        self.assertEqual(response.data["body"], "updated")
        self.assertEqual(response.data["sent_by"], self.user.username)
        self.assertIn("created_at", response.data)

    def test_non_author_cannot_update(self):
        other = get_user_model().objects.create_user(username="u2", password="pw")
        self.client.force_authenticate(other)
        response = self.client.patch(
            self._url(), {"text": "updated"}, format="json"
        )

        self.assertEqual(response.status_code, 403)
        self.message.refresh_from_db()
        self.assertEqual(self.message.body, "hello")

    def test_room_agent_can_update(self):
        self.room.agent = self.agent
        self.room.save(update_fields=["agent"])

        self.client.force_authenticate(self.agent)
        response = self.client.patch(
            self._url(), {"text": "updated"}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.message.refresh_from_db()
        self.assertEqual(self.message.body, "updated")

    @patch("chat.api_views.get_channel_layer")
    def test_broadcasts_updated_event(self, mock_get_channel_layer):
        mock_layer = mock_get_channel_layer.return_value
        mock_layer.group_send = AsyncMock()

        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self._url(), {"text": "updated"}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        mock_layer.group_send.assert_awaited_once()

        group_name, payload = mock_layer.group_send.await_args.args
        self.assertEqual(group_name, f"channel_{self.room.uuid}")
        self.assertEqual(payload["type"], "chat.message")

        event = payload["payload"]
        self.assertEqual(event["type"], "message.updated")
        self.assertEqual(event["cid"], f"messaging:{self.room.uuid}")

        message_payload = event["message"]
        self.assertEqual(message_payload["id"], self.message.id)
        self.assertEqual(message_payload["body"], "updated")
        self.assertEqual(message_payload["sent_by"], self.user.username)
        self.assertIn("created_at", message_payload)
