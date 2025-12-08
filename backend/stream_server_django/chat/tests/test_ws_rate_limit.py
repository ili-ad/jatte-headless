import jwt
from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.test import TransactionTestCase, override_settings

from jatte.asgi import application


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    WS_BUCKET_CAPACITY=3,
    WS_BUCKET_REFILL_PER_SEC=0,
)
class WebsocketRateLimitTests(TransactionTestCase):
    databases = {"default"}

    def test_websocket_rate_limit(self):
        with self.assertLogs("chat.consumers", level="WARNING") as captured:
            async_to_sync(self._exercise_websocket)()

        messages = "\n".join(captured.output)
        assert "rate_limited=true" in messages
        assert "cid=messaging:rate-limit" in messages
        assert "ws-user" in messages

    async def _exercise_websocket(self) -> None:
        token = jwt.encode(
            {"sub": "ws-user", "email": "ws@example.com"},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")

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
