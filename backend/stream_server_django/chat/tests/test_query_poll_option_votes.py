from django.conf import settings
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Poll, PollOption, PollVote


@override_settings(ROOT_URLCONF="chat.urls")
class QueryPollOptionVotesAPITests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="x",
            supabase_uid="owner",
        )
        self.voter = CustomUser.objects.create_user(
            username="voter",
            email="voter@example.com",
            password="x",
            supabase_uid="voter",
        )

        self.poll = Poll.objects.create(question="Best color?", user=self.owner)
        self.option = PollOption.objects.create(
            poll=self.poll,
            text="Blue",
            user=self.owner,
        )

    def make_token(self, sub="owner", email="owner@example.com"):
        return jwt.encode(
            {"sub": sub, "email": email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_requires_authentication(self):
        url = reverse(
            "poll-option-votes",
            kwargs={"poll_id": self.poll.id, "option_id": self.option.id},
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_returns_paginated_votes(self):
        for _ in range(3):
            PollVote.objects.create(poll=self.poll, option=self.option, user=self.voter)

        token = self.make_token()
        url = reverse(
            "poll-option-votes",
            kwargs={"poll_id": self.poll.id, "option_id": self.option.id},
        )

        first_response = self.client.get(
            f"{url}?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertIn("results", first_response.data)
        self.assertEqual(len(first_response.data["results"]), 2)
        self.assertEqual(first_response.data["count"], 3)
        next_cursor = first_response.data.get("next")
        self.assertIsInstance(next_cursor, str)

        second_response = self.client.get(
            f"{url}?limit=2&cursor={next_cursor}",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(len(second_response.data["results"]), 1)
        self.assertNotIn("next", second_response.data)

    def test_invalid_cursor_returns_400(self):
        token = self.make_token()
        url = reverse(
            "poll-option-votes",
            kwargs={"poll_id": self.poll.id, "option_id": self.option.id},
        )

        response = self.client.get(
            f"{url}?cursor=9999",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)
