import pytest
import jwt
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from jatte.asgi import application
from chat.models import Channel, Message


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_message_round_trip():
    channel = await sync_to_async(Channel.objects.create)(uuid="r1", client="c1")
    token = jwt.encode({"sub": "u1", "email": "u1@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"type": "message.new", "cid": f"messaging:{channel.uuid}", "text": "hello"})
    event = await communicator.receive_json_from()
    assert event == {"cid": f"messaging:{channel.uuid}", "text": "hello", "user": "u1", "type": "message.new"}

    await communicator.disconnect()
    assert await sync_to_async(Message.objects.count)() == 1


