from unittest.mock import AsyncMock, patch

from chat.models import Channel, Message, Room
from chat.utils import group_name_for_cid
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


@override_settings(ROOT_URLCONF="chat.urls")
class DeleteMessageAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u1", password="pw")
        self.agent = User.objects.create_user(username="agent", password="pw")
        self.room = Room.objects.create(uuid="room-1", client="client-1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(self.message)

    def _url(self):
        return reverse(
            "room-message-delete",
            kwargs={
                "cid": f"messaging:{self.room.uuid}",
                "message_id": self.message.id,
            },
        )

    def test_author_can_delete_message(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, 204)

        self.message.refresh_from_db()
        self.assertIsNotNone(self.message.deleted_at)

    def test_non_author_is_forbidden(self):
        other = get_user_model().objects.create_user(username="u2", password="pw")
        self.client.force_authenticate(other)
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, 403)

        self.message.refresh_from_db()
        self.assertIsNone(self.message.deleted_at)

    def test_room_agent_can_delete(self):
        self.room.agent = self.agent
        self.room.save(update_fields=["agent"])

        self.client.force_authenticate(self.agent)
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, 204)

        self.message.refresh_from_db()
        self.assertIsNotNone(self.message.deleted_at)

    @patch("chat.api_views.get_channel_layer")
    def test_broadcasts_deleted_event(self, mock_get_channel_layer):
        mock_layer = mock_get_channel_layer.return_value
        mock_layer.group_send = AsyncMock()

        self.client.force_authenticate(self.user)
        response = self.client.delete(self._url())

        self.assertEqual(response.status_code, 204)
        mock_layer.group_send.assert_awaited_once()

        group_name, payload = mock_layer.group_send.await_args.args
        expected_group = group_name_for_cid(f"messaging:{self.room.uuid}")
        self.assertEqual(group_name, expected_group)
        self.assertEqual(payload["type"], "chat.message")

        event = payload["payload"]
        self.assertEqual(event["type"], "message.deleted")
        self.assertEqual(event["cid"], self.room.uuid)
        self.assertEqual(event["message_id"], self.message.id)
        self.assertEqual(event["deleted_by"], self.user.id)

        self.message.refresh_from_db()
        self.assertEqual(event["ts"], self.message.deleted_at.isoformat())
