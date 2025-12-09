import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

import jwt
from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.management import call_command
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APIClient, APITestCase
from urllib.parse import quote

from django.contrib.auth import get_user_model

from stream_server_django.polls.models import Poll, PollOption, PollVote
from jatte.asgi import application
User = get_user_model()

call_command("migrate", run_syncdb=True, verbosity=0)


class PollVoteWebsocketTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        call_command("migrate", run_syncdb=True, verbosity=0)

    async def _setup_user_poll(self):
        user = await sync_to_async(User.objects.create_user)(
            username="bob",
            email="bob@example.com",
            password="pwd",
            supabase_uid="bob",
        )
        poll = await sync_to_async(Poll.objects.create)(
            cid="messaging:general",
            question="Best snack?",
            created_by=user,
        )
        option_a = await sync_to_async(PollOption.objects.create)(
            poll=poll,
            text="Chips",
            created_by=user,
        )
        option_b = await sync_to_async(PollOption.objects.create)(
            poll=poll,
            text="Fruit",
            created_by=user,
        )
        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return user, poll, option_a, option_b, token

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="jatte.urls",
    )
    def test_cast_vote_creates_and_broadcasts(self):
        async_to_sync(self._run_cast_vote_creates_and_broadcasts)()

    async def _run_cast_vote_creates_and_broadcasts(self):
        user, poll, option_a, _option_b, token = await self._setup_user_poll()

        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()
        await communicator.send_json_to({"type": "channel.watch", "cid": poll.cid})
        await communicator.receive_json_from()

        client = APIClient()
        response = await sync_to_async(client.post)(
            f"/polls/{poll.id}/options/{option_a.id}/votes/",
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["option_id"], str(option_a.id))
        self.assertIsNotNone(body["poll_vote"])
        exists = await sync_to_async(
            PollVote.objects.filter(poll=poll, user=user).exists
        )()
        self.assertTrue(exists)

        event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "poll.vote_casted")
        self.assertEqual(event["cid"], poll.cid)
        self.assertEqual(event["option_id"], str(option_a.id))
        self.assertEqual(event["poll_vote"]["option_id"], str(option_a.id))
        await communicator.disconnect()

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="jatte.urls",
    )
    def test_change_vote_updates_and_broadcasts(self):
        async_to_sync(self._run_change_vote_updates_and_broadcasts)()

    async def _run_change_vote_updates_and_broadcasts(self):
        user, poll, option_a, option_b, token = await self._setup_user_poll()
        await sync_to_async(PollVote.objects.create)(poll=poll, option=option_a, user=user)

        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()
        await communicator.send_json_to({"type": "channel.watch", "cid": poll.cid})
        await communicator.receive_json_from()

        client = APIClient()
        response = await sync_to_async(client.post)(
            f"/polls/{poll.id}/options/{option_b.id}/votes/",
            {},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["from_option_id"], str(option_a.id))
        self.assertEqual(body["option_id"], str(option_b.id))

        event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "poll.vote_changed")
        self.assertEqual(event["from_option_id"], str(option_a.id))
        self.assertEqual(event["to_option_id"], str(option_b.id))
        updated_vote = await sync_to_async(PollVote.objects.get)(poll=poll, user=user)
        self.assertEqual(updated_vote.option_id, option_b.id)
        await communicator.disconnect()

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="jatte.urls",
    )
    def test_remove_vote_deletes_and_broadcasts(self):
        async_to_sync(self._run_remove_vote_deletes_and_broadcasts)()

    async def _run_remove_vote_deletes_and_broadcasts(self):
        user, poll, option_a, _option_b, token = await self._setup_user_poll()
        await sync_to_async(PollVote.objects.create)(poll=poll, option=option_a, user=user)

        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()
        await communicator.send_json_to({"type": "channel.watch", "cid": poll.cid})
        await communicator.receive_json_from()

        client = APIClient()
        response = await sync_to_async(client.delete)(
            f"/polls/{poll.id}/options/{option_a.id}/votes/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        remaining = await sync_to_async(
            PollVote.objects.filter(poll=poll, user=user).exists
        )()
        self.assertFalse(remaining)

        event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "poll.vote_removed")
        self.assertEqual(event["option_id"], str(option_a.id))
        await communicator.disconnect()


class PollVoteQueryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="carol",
            email="carol@example.com",
            password="pwd",
            supabase_uid="carol",
        )
        self.other = User.objects.create_user(
            username="dave",
            email="dave@example.com",
            password="pwd",
            supabase_uid="dave",
        )
        self.poll = Poll.objects.create(
            cid="messaging:general",
            question="Best day?",
            created_by=self.user,
        )
        self.option = PollOption.objects.create(
            poll=self.poll,
            text="Friday",
            created_by=self.user,
        )
        PollVote.objects.create(poll=self.poll, option=self.option, user=self.user)
        PollVote.objects.create(poll=self.poll, option=self.option, user=self.other)

    def _headers(self, user):
        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_query_votes_returns_paginated_results(self):
        response = self.client.get(
            f"/polls/{self.poll.id}/options/{self.option.id}/votes/?limit=1",
            **self._headers(self.user),
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertIn("count", data)
        self.assertEqual(data["count"], 2)
        self.assertIn("next", data)
        if data["next"]:
            encoded_cursor = quote(data["next"], safe="")
            next_response = self.client.get(
                f"/polls/{self.poll.id}/options/{self.option.id}/votes/?cursor={encoded_cursor}",
                **self._headers(self.user),
            )
            self.assertEqual(next_response.status_code, 200)
            next_data = next_response.json()
            self.assertEqual(len(next_data["results"]), 1)
