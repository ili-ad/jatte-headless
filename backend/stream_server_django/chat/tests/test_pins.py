import jwt
from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.core.management import call_command
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APIClient

from stream_server_django.chat.models import Channel, Message, Pin, Room
from django.contrib.auth import get_user_model
from jatte.asgi import application


User = get_user_model()


class PinWebsocketTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        call_command("migrate", run_syncdb=True, verbosity=0)

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="chat.urls",
    )
    def test_pin_message_with_update_broadcasts_event(self):
        async_to_sync(self._run_pin_message_with_update_broadcasts_event)()

    async def _run_pin_message_with_update_broadcasts_event(self):
        user = await sync_to_async(User.objects.create_user)(
            username="pinner", email="pinner@example.com"
        )
        channel = await sync_to_async(Channel.objects.create)(uuid="support", client="stream")
        room = await sync_to_async(Room.objects.create)(uuid="support", client="stream")
        message = await sync_to_async(Message.objects.create)(
            channel=channel, body="Need help", sent_by=user.username
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
        url = f"/api/messages/{message.id}/"
        response = await sync_to_async(client.put)(
            url,
            {"pinned": True},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["pinned"])
        self.assertEqual(body["pinned_by"], user.id)

        event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "message.updated")
        self.assertEqual(event["cid"], cid)
        message_payload = event["message"]
        self.assertEqual(message_payload["id"], message.id)
        self.assertTrue(message_payload["pinned"])
        self.assertEqual(message_payload["pinned_by"], user.id)

        exists = await sync_to_async(Pin.objects.filter(message=message).exists)()
        self.assertTrue(exists)

        await communicator.disconnect()

    @override_settings(
        CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
        ROOT_URLCONF="chat.urls",
    )
    def test_unpin_message_removes_pin_and_notifies(self):
        async_to_sync(self._run_unpin_message_removes_pin_and_notifies)()

    async def _run_unpin_message_removes_pin_and_notifies(self):
        user = await sync_to_async(User.objects.create_user)(
            username="unpin", email="unpin@example.com"
        )
        channel = await sync_to_async(Channel.objects.create)(uuid="ops", client="stream")
        room = await sync_to_async(Room.objects.create)(uuid="ops", client="stream")
        message = await sync_to_async(Message.objects.create)(
            channel=channel, body="Working on it", sent_by=user.username
        )
        await sync_to_async(room.messages.add)(message)
        await sync_to_async(Pin.objects.create)(message=message, user=user)

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
        url = f"/api/messages/{message.id}/"
        response = await sync_to_async(client.put)(
            url,
            {"pinned": False},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["pinned"])
        self.assertIsNone(data["pinned_by"])

        event = await communicator.receive_json_from()
        self.assertEqual(event["type"], "message.updated")
        self.assertEqual(event["cid"], cid)
        payload = event["message"]
        self.assertEqual(payload["id"], message.id)
        self.assertFalse(payload["pinned"])
        self.assertIsNone(payload["pinned_by"])

        pins_remaining = await sync_to_async(Pin.objects.filter(message=message).exists)()
        self.assertFalse(pins_remaining)

        await communicator.disconnect()
