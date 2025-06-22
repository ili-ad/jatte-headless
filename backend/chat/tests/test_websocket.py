import pytest
import jwt
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.test import override_settings
from jatte.asgi import application
from chat.models import Channel, Message


@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_message_round_trip():
    channel = await sync_to_async(Channel.objects.create)(uuid="r1", client="c1")
    token = jwt.encode({"sub": "u1", "email": "u1@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
    connected, _ = await communicator.connect()
    assert connected

    # first event is presence join
    join = await communicator.receive_json_from()
    assert join == {"type": "user.join", "user": "u1"}

    await communicator.send_json_to({"type": "message.new", "cid": f"messaging:{channel.uuid}", "text": "hello"})
    event = await communicator.receive_json_from()
    assert event == {"cid": f"messaging:{channel.uuid}", "text": "hello", "user": "u1", "type": "message.new"}

    await communicator.disconnect()
    assert await sync_to_async(Message.objects.count)() == 1


@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_two_clients_fanout():
    channel = await sync_to_async(Channel.objects.create)(uuid="r2", client="c1")
    token1 = jwt.encode({"sub": "u1", "email": "u1@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    token2 = jwt.encode({"sub": "u2", "email": "u2@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    c1 = WebsocketCommunicator(application, f"/ws/chat/?token={token1}")
    c2 = WebsocketCommunicator(application, f"/ws/chat/?token={token2}")
    assert (await c1.connect())[0]
    assert (await c2.connect())[0]

    # each client receives their own join event
    await c1.receive_json_from()
    await c2.receive_json_from()

    await c1.send_json_to({"type": "message.new", "cid": f"messaging:{channel.uuid}", "text": "hi"})
    event = await c2.receive_json_from()
    assert event == {"cid": f"messaging:{channel.uuid}", "text": "hi", "user": "u1", "type": "message.new"}

    await c1.disconnect()
    await c2.disconnect()


