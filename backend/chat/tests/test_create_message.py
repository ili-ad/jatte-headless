from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.test import override_settings
from chat.models import Room

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

    def test_missing_body(self):
        self.client.force_authenticate(self.user)
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_unauthenticated(self):
        url = reverse("room-messages", kwargs={"room_uuid": self.room.uuid})
        resp = self.client.post(url, {"text": "hi"}, format="json")
        self.assertEqual(resp.status_code, 403)
