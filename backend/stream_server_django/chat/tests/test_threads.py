from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

from stream_server_django.chat.models import Channel, Message, Room

@override_settings(ROOT_URLCONF="chat.urls")
class ThreadsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.room = Room.objects.create(uuid="r1", client="c1")
        channel = Channel.objects.create(uuid=self.room.uuid, client=self.room.client)
        self.parent_one = Message.objects.create(channel=channel, body="p1", sent_by="u1")
        self.parent_two = Message.objects.create(channel=channel, body="p2", sent_by="u3")
        replies_one = [
            Message.objects.create(
                channel=channel,
                body=f"r1-{i}",
                sent_by="u2",
                reply_to=self.parent_one,
            )
            for i in range(3)
        ]
        replies_two = [
            Message.objects.create(
                channel=channel,
                body="r2-0",
                sent_by="u4",
                reply_to=self.parent_two,
            )
        ]
        self.room.messages.add(self.parent_one, *replies_one)
        self.room.messages.add(self.parent_two, *replies_two)

    def test_list_threads(self):
        token = self.make_token()
        url = reverse("threads")
        res = self.client.get(
            url,
            {"cid": "messaging:r1"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("results", res.data)
        self.assertEqual(len(res.data["results"]), 2)
        thread_ids = {item["thread_id"] for item in res.data["results"]}
        self.assertIn(f"root-{self.parent_one.id}", thread_ids)
        self.assertIn(f"root-{self.parent_two.id}", thread_ids)

    def test_threads_support_pagination(self):
        token = self.make_token()
        url = reverse("threads")
        first_page = self.client.get(
            url,
            {"cid": "messaging:r1", "limit": 1},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(len(first_page.data["results"]), 1)
        next_cursor = first_page.data["next"]
        self.assertIsNotNone(next_cursor)

        second_page = self.client.get(
            url,
            {"cid": "messaging:r1", "limit": 1, "cursor": next_cursor},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(len(second_page.data["results"]), 1)
        self.assertNotEqual(
            first_page.data["results"][0]["thread_id"],
            second_page.data["results"][0]["thread_id"],
        )

    def test_threads_requires_auth(self):
        url = reverse("threads")
        res = self.client.get(url, {"cid": "messaging:r1"})
        self.assertEqual(res.status_code, 403)

    def test_threads_wrong_method(self):
        token = self.make_token()
        url = reverse("threads")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_threads_missing_cid_returns_error(self):
        token = self.make_token()
        url = reverse("threads")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 400)
