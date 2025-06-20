import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from jatte.asgi import application
from chat.models import Room


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_websocket_send_message():
    room = await sync_to_async(Room.objects.create)(uuid="r1", client="c1")
    communicator = WebsocketCommunicator(application, f"/ws/{room.uuid}/")
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"type": "channel.watch"})
    data = await communicator.receive_json_from()
    assert data["type"] == "channel.watch"
    assert data["messages"] == []

    await communicator.send_json_to({"type": "sendMessage", "text": "hello", "user": "u1"})
    event = await communicator.receive_json_from()
    assert event["type"] == "message.new"
    assert event["text"] == "hello"
    assert event["user"] == "u1"

    await communicator.disconnect()
    count = await sync_to_async(room.messages.count)()
    assert count == 1
    msg = await sync_to_async(room.messages.first)()
    assert msg.body == "hello"
    assert msg.sent_by == "u1"
