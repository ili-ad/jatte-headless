import jwt
from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.management import call_command
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APIClient

from chat.models import Channel, Message, Reaction, Room
from django.contrib.auth import get_user_model
from jatte.asgi import application


User = get_user_model()


class ReactionWebsocketTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        call_command("migrate", run_syncdb=True, verbosity=0)

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="chat.urls",
    )
    def test_add_reaction_persists_and_broadcasts(self):
        async_to_sync(self._run_add_reaction_persists_and_broadcasts)()

    async def _run_add_reaction_persists_and_broadcasts(self):
        user = await sync_to_async(User.objects.create_user)(
            username="alice", email="alice@example.com"
        )
        channel = await sync_to_async(Channel.objects.create)(uuid="general", client="stream")
        room = await sync_to_async(Room.objects.create)(uuid="general", client="stream")
        message = await sync_to_async(Message.objects.create)(
            channel=channel, body="hello", sent_by=user.username
        )
        await sync_to_async(room.messages.add)(message)

        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()

        cid = f"messaging:{channel.uuid}"
        await communicator.send_json_to({"type": "channel.watch", "cid": cid})
        await communicator.receive_json_from()

        client = APIClient()
        url = f"/api/messages/{message.id}/reactions/like/"
        response = await sync_to_async(client.post)(
            url,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "message_id": str(message.id), "type": "like"},
        )

        event = await communicator.receive_json_from()
        self.assertEqual(event["event_type"], "reaction.new")
        self.assertEqual(event["event"], "reaction.new")
        self.assertEqual(event["cid"], cid)
        self.assertEqual(event["message_id"], str(message.id))
        self.assertEqual(event["user_id"], user.id)
        self.assertEqual(event["type"], "like")
        self.assertEqual(event["reaction_type"], "like")
        self.assertIn("ts", event)

        count = await sync_to_async(
            Reaction.objects.filter(message=message, user=user, type="like").count
        )()
        self.assertEqual(count, 1)

        await communicator.disconnect()

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="chat.urls",
    )
    def test_delete_reaction_clears_and_broadcasts(self):
        async_to_sync(self._run_delete_reaction_clears_and_broadcasts)()

    async def _run_delete_reaction_clears_and_broadcasts(self):
        user = await sync_to_async(User.objects.create_user)(
            username="bob", email="bob@example.com"
        )
        channel = await sync_to_async(Channel.objects.create)(uuid="random", client="stream")
        room = await sync_to_async(Room.objects.create)(uuid="random", client="stream")
        message = await sync_to_async(Message.objects.create)(
            channel=channel, body="ping", sent_by=user.username
        )
        await sync_to_async(room.messages.add)(message)
        await sync_to_async(Reaction.objects.create)(message=message, user=user, type="wow")

        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()

        cid = f"messaging:{channel.uuid}"
        await communicator.send_json_to({"type": "channel.watch", "cid": cid})
        await communicator.receive_json_from()

        client = APIClient()
        url = f"/api/messages/{message.id}/reactions/wow/"
        response = await sync_to_async(client.delete)(
            url,
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "message_id": str(message.id), "type": "wow"},
        )

        event = await communicator.receive_json_from()
        self.assertEqual(event["event_type"], "reaction.deleted")
        self.assertEqual(event["event"], "reaction.deleted")
        self.assertEqual(event["cid"], cid)
        self.assertEqual(event["message_id"], str(message.id))
        self.assertEqual(event["user_id"], user.id)
        self.assertEqual(event["type"], "wow")
        self.assertEqual(event["reaction_type"], "wow")

        remaining = await sync_to_async(
            Reaction.objects.filter(message=message, user=user, type="wow").exists
        )()
        self.assertFalse(remaining)

        await communicator.disconnect()
