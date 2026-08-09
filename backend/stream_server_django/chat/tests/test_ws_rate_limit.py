from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase, override_settings

from jatte.asgi import application
from jatte.tests.jwt_factory import make_test_token
from stream_server_django.chat.models import Message, Room


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    WS_BUCKET_CAPACITY=3,
    WS_BUCKET_REFILL_PER_SEC=0,
)
class WebsocketRateLimitTests(TransactionTestCase):
    databases = {"default"}

    def test_websocket_rate_limit(self):
        with self.assertLogs(
            "stream_server_django.chat.consumers", level="WARNING"
        ) as captured:
            async_to_sync(self._exercise_websocket)()

        messages = "\n".join(captured.output)
        assert "rate_limited=true" in messages
        assert "cid=messaging:rate-limit" in messages
        assert "ws-user" in messages

    async def _exercise_websocket(self) -> None:
        await sync_to_async(Room.objects.create)(uuid="rate-limit", client="ws-user")
        token = make_test_token("ws-user", email="ws@example.com")
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token={token}",
            headers=[(b"origin", b"http://localhost:3000")],
        )

        connected, _ = await communicator.connect()
        assert connected

        await communicator.receive_json_from()

        cid = "messaging:rate-limit"
        await communicator.send_json_to({"type": "channel.watch", "cid": cid})
        await communicator.receive_json_from()

        await communicator.send_json_to({"type": "typing.start", "cid": cid})
        await communicator.receive_json_from()
        await communicator.send_json_to({"type": "typing.start", "cid": cid})
        await communicator.receive_json_from()
        await communicator.send_json_to({"type": "typing.start", "cid": cid})

        close_event = await communicator.receive_output(timeout=1)
        assert close_event["type"] == "websocket.close"
        assert close_event.get("code") == 4408

        await communicator.wait()


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    WS_MAX_EVENT_BYTES=256,
)
class WebsocketPayloadLimitTests(TransactionTestCase):
    databases = {"default"}

    def test_oversized_event_closes_1009_without_side_effects(self):
        async_to_sync(self._exercise_limit)()
        self.assertEqual(Message.objects.count(), 0)

    async def _exercise_limit(self) -> None:
        token = make_test_token("payload-user")
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token={token}",
            headers=[(b"origin", b"http://localhost:3000")],
        )
        connected, _ = await communicator.connect()
        assert connected
        await communicator.receive_json_from()

        await communicator.send_to(
            text_data='{"type":"message.new","cid":"messaging:guess","text":"'
            + ("x" * 512)
            + '"}'
        )
        close_event = await communicator.receive_output(timeout=1)
        assert close_event == {"type": "websocket.close", "code": 1009}
        await communicator.wait()
