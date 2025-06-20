import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from jatte.asgi import application
from chat.models import Channel


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_websocket_send_message():
    channel = await sync_to_async(Channel.objects.create)(uuid="r1", client="c1")
    communicator = WebsocketCommunicator(application, f"/ws/{channel.uuid}/")
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
    count = await sync_to_async(channel.messages.count)()
    assert count == 1
    msg = await sync_to_async(channel.messages.first)()
    assert msg.body == "hello"
    assert msg.sent_by == "u1"


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_mark_read_and_count_unread():
    channel = await sync_to_async(Channel.objects.create)(uuid="r2", client="c1")
    await sync_to_async(channel.messages.create)(sent_by="u2", body="hi")
    await sync_to_async(channel.messages.create)(sent_by="u2", body="there")

    communicator = WebsocketCommunicator(application, f"/ws/{channel.uuid}/")
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"type": "countUnread", "user": "u1"})
    data = await communicator.receive_json_from()
    assert data["type"] == "unread.count"
    assert data["unread"] == 2

    await communicator.send_json_to({"type": "markRead", "user": "u1"})
    data = await communicator.receive_json_from()
    assert data["type"] == "markRead"
    assert data["status"] == "ok"

    await communicator.send_json_to({"type": "countUnread", "user": "u1"})
    data = await communicator.receive_json_from()
    assert data["unread"] == 0

    await communicator.send_json_to({"type": "sendMessage", "text": "new", "user": "u2"})
    await communicator.receive_json_from()

    await communicator.send_json_to({"type": "countUnread", "user": "u1"})
    data = await communicator.receive_json_from()
    assert data["unread"] == 1

    await communicator.disconnect()
