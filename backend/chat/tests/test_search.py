from django.conf import settings
from django.urls import reverse
import jwt
from rest_framework.test import APITestCase
from django.test import override_settings

from chat.models import Channel, Message, Room


@override_settings(ROOT_URLCONF="chat.urls")
class SearchMessagesAPITests(APITestCase):
    def setUp(self):
        self.room = Room.objects.create(uuid="general", client="u1")
        self.channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello world",
            sent_by="u1",
        )
        self.room.messages.add(self.message)
        self.token = jwt.encode(
            {"sub": "u1", "email": "u1@example.com"},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token}"}

    def test_search_messages_returns_results(self):
        url = reverse("search-messages")
        response = self.client.get(url, {"q": "hello"}, **self.auth_headers())
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)
        result = response.data["results"][0]
        self.assertEqual(result["id"], self.message.id)
        self.assertEqual(result["text"], "hello world")
        self.assertEqual(result["user_id"], "u1")
        self.assertEqual(result["cid"], f"messaging:{self.channel.uuid}")
        self.assertIsNotNone(result["created_at"])

    def test_search_messages_filters_by_cid(self):
        other_room = Room.objects.create(uuid="support", client="u1")
        other_channel = Channel.objects.create(
            uuid=other_room.uuid,
            client=other_room.client,
        )
        other_message = Message.objects.create(
            channel=other_channel,
            body="hello again",
            sent_by="u1",
        )
        other_room.messages.add(other_message)

        url = reverse("search-messages")
        response = self.client.get(
            url,
            {"q": "hello", "cid": f"messaging:{self.room.uuid}"},
            **self.auth_headers(),
        )
        self.assertEqual(response.status_code, 200)
        ids = {entry["id"] for entry in response.data.get("results", [])}
        self.assertIn(self.message.id, ids)
        self.assertNotIn(other_message.id, ids)

    def test_search_messages_paginates_with_before_cursor(self):
        second = Message.objects.create(
            channel=self.channel,
            body="hello again",
            sent_by="u1",
        )
        third = Message.objects.create(
            channel=self.channel,
            body="hello there",
            sent_by="u1",
        )
        for msg in (second, third):
            self.room.messages.add(msg)

        url = reverse("search-messages")
        first_page = self.client.get(
            url,
            {"q": "hello", "limit": 2},
            **self.auth_headers(),
        )
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(len(first_page.data.get("results", [])), 2)
        cursor = first_page.data.get("next")
        self.assertIsInstance(cursor, str)
        second_page = self.client.get(
            url,
            {"q": "hello", "before": cursor},
            **self.auth_headers(),
        )
        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(len(second_page.data.get("results", [])), 1)
        remaining_id = second_page.data["results"][0]["id"]
        self.assertIn(remaining_id, {self.message.id, second.id, third.id})
        self.assertIsNone(second_page.data.get("next"))

    def test_search_messages_short_query_returns_422(self):
        url = reverse("search-messages")
        response = self.client.get(url, {"q": "a"}, **self.auth_headers())
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.data)

    def test_search_messages_invalid_limit_returns_422(self):
        url = reverse("search-messages")
        response = self.client.get(
            url,
            {"q": "hello", "limit": 0},
            **self.auth_headers(),
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.data)
