from django.contrib.auth import get_user_model
from django.core.cache import caches
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Channel, Message, Room

TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "default",
    },
    "throttles": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "throttles",
    },
}


@override_settings(
    ROOT_URLCONF="chat.urls",
    CACHES=TEST_CACHES,
    MESSAGE_BURST_RATE="2/minute",
    MESSAGE_SUSTAINED_RATE="10/hour",
    REACTION_BURST_RATE="3/minute",
    REACTION_SUSTAINED_RATE="10/hour",
)
class RestThrottleTests(APITestCase):
    def setUp(self):
        super().setUp()
        caches["throttles"].clear()
        User = get_user_model()
        self.user = User.objects.create_user(username="tester", password="pw")
        self.room = Room.objects.create(uuid="room-1", client="client-1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.room.messages.clear()

    def test_message_create_is_throttled(self):
        self.client.force_authenticate(self.user)
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})

        first = self.client.post(url, {"text": "hi"}, format="json")
        second = self.client.post(url, {"text": "there"}, format="json")
        blocked = self.client.post(url, {"text": "blocked"}, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(blocked.status_code, 429)
        self.assertIn("Expected available in", blocked.data["detail"])

    def test_reaction_is_throttled(self):
        self.client.force_authenticate(self.user)
        message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by=self.user.username,
        )
        self.room.messages.add(message)
        url = reverse(
            "message-reaction-type",
            kwargs={"message_id": str(message.id), "reaction_type": "like"},
        )

        for _ in range(3):
            self.assertEqual(self.client.post(url).status_code, 200)
        response = self.client.post(url)

        self.assertEqual(response.status_code, 429)
        self.assertIn("Expected available in", response.data["detail"])
