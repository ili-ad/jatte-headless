from unittest.mock import AsyncMock, patch

from chat.models import Room
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
        self.assertEqual(group_name, f"channel_{self.room.uuid}")
        self.assertEqual(payload["type"], "chat.message")
        event = payload["payload"]
        self.assertEqual(event["type"], "message.new")
        self.assertEqual(event["cid"], f"messaging:{self.room.uuid}")
        self.assertEqual(event["message"]["body"], "hi")
        self.assertEqual(event["message"]["text"], "hi")
