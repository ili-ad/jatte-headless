from unittest.mock import AsyncMock, patch

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat.utils import group_name_for_cid
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


@override_settings(ROOT_URLCONF="chat.urls")
class CreateMessageAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="u1", password="pw")
        self.room = Room.objects.create(uuid="r1", client="c1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)

    def test_create_message(self):
        self.client.force_authenticate(self.user)
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {"text": "hi"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["body"], "hi")
        self.assertEqual(resp.data["text"], "hi")

    def test_missing_body(self):
        self.client.force_authenticate(self.user)
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_unauthenticated(self):
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {"text": "hi"}, format="json")
        self.assertEqual(resp.status_code, 403)

    @patch("chat.api_views.get_channel_layer")
    def test_broadcasts_message_event(self, mock_get_channel_layer):
        self.client.force_authenticate(self.user)
        mock_layer = mock_get_channel_layer.return_value
        mock_layer.group_send = AsyncMock()

        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {"text": "hi"}, format="json")

        self.assertEqual(resp.status_code, 201)
        mock_layer.group_send.assert_awaited_once()
        group_name, payload = mock_layer.group_send.await_args.args
        expected_group = group_name_for_cid(f"messaging:{self.room.uuid}")
        self.assertEqual(group_name, expected_group)
        self.assertEqual(payload["type"], "chat.message")
        event = payload["payload"]
        self.assertEqual(event["type"], "message.new")
        self.assertEqual(event["cid"], f"messaging:{self.room.uuid}")
        self.assertEqual(event["message"]["body"], "hi")
        self.assertEqual(event["message"]["text"], "hi")

    @patch("chat.api_views.get_channel_layer")
    def test_broadcasts_thread_message_event(self, mock_get_channel_layer):
        self.client.force_authenticate(self.user)
        mock_layer = mock_get_channel_layer.return_value
        mock_layer.group_send = AsyncMock()

        parent = Message.objects.create(channel=self.channel, body="parent", sent_by="u2")
        self.room.messages.add(parent)

        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(
            url,
            {"text": "reply", "reply_to": parent.id},
            format="json",
        )

        self.assertEqual(resp.status_code, 201)
        calls = mock_layer.group_send.await_args_list
        self.assertEqual(len(calls), 2)

        main_group, main_payload = calls[0].args
        expected_group = group_name_for_cid(f"messaging:{self.room.uuid}")
        self.assertEqual(main_group, expected_group)
        self.assertEqual(main_payload["payload"]["message"]["parent_id"], parent.id)

        thread_group, thread_payload = calls[1].args
        expected_thread_cid = f"messaging:{self.room.uuid}:thread:{parent.id}"
        self.assertEqual(
            thread_group,
            group_name_for_cid(f"messaging:{self.room.uuid}:thread:{parent.id}"),
        )
        thread_event = thread_payload["payload"]
        self.assertEqual(thread_event["cid"], expected_thread_cid)
        self.assertEqual(thread_event["message"]["parent_id"], parent.id)
