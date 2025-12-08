import pytest
import jwt
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.test import override_settings

from stream_server_django.chat.models import Channel, Message, Room
from jatte.asgi import application


@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_channel_watch_initializes_state():
    channel = await sync_to_async(Channel.objects.create)(uuid="general", client="stream")
    room = await sync_to_async(Room.objects.create)(uuid="general", client="stream")
    message = await sync_to_async(Message.objects.create)(
        channel=channel,
        body="hello",
        sent_by="tester",
    )
    await sync_to_async(room.messages.add)(message)

    token = jwt.encode({"sub": "u1", "email": "u1@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
    connected, _ = await communicator.connect()
    assert connected

    join_event = await communicator.receive_json_from()
    assert join_event == {"type": "user.join", "user": "u1"}

    cid = f"messaging:{channel.uuid}"
    await communicator.send_json_to({"type": "channel.watch", "cid": cid})

    payload = await communicator.receive_json_from()
    assert payload["type"] == "initialized"
    assert payload["initialized"] is True
    assert payload["cid"] == cid
    assert isinstance(payload["messages"], list)
    assert payload["messages"], "expected messages array to be non-empty"
    assert payload["next"] is None
    assert isinstance(payload["members"], list)
    assert any(
        member.get("user", {}).get("id") == "tester"
        or member.get("user_id") == "tester"
        for member in payload["members"]
    )

    await communicator.send_json_to({"type": "message.new", "cid": cid, "text": "ping"})
    broadcast = await communicator.receive_json_from()
    assert broadcast == {"type": "message.new", "cid": cid, "text": "ping", "user": "u1"}

    await communicator.disconnect()
    count = await sync_to_async(Message.objects.filter(channel=channel).count)()
    assert count == 2
