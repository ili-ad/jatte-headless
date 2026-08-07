"""Authorized WebSocket contract coverage for the frontend Stream adapter."""

import jwt
import pytest
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat.routing import websocket_urlpatterns
from stream_server_django.chat.serializers import MessageSerializer
from stream_server_django.chat.utils import group_name_for_cid


User = get_user_model()
application = URLRouter(websocket_urlpatterns)


def make_token(sub):
    return jwt.encode(
        {"sub": sub, "email": f"{sub}@example.com"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )


async def connect(room_key, sub):
    communicator = WebsocketCommunicator(
        application, f"/ws/{room_key}/?token={make_token(sub)}"
    )
    connected, code = await communicator.connect()
    return communicator, connected, code


@sync_to_async
def create_contract_room(uuid, username, message_count=1):
    user = User.objects.filter(username=username).first()
    if user is None:
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            supabase_uid=username,
            password="x",
        )
    room = Room.objects.create(uuid=uuid, client=username)
    channel = Channel.objects.create(uuid=uuid, client=username)
    messages = []
    for index in range(message_count):
        message = Message.objects.create(
            channel=channel,
            body=f"message {index}",
            sent_by=username,
        )
        room.messages.add(message)
        messages.append(message)
    return user, room, messages


@sync_to_async
def serialized_message(message_id, *, text=None, attachment=None):
    message = Message.objects.get(pk=message_id)
    if text is not None:
        message.body = text
    if attachment is not None:
        message.attachments = [attachment]
    message.save()
    return dict(MessageSerializer(message).data)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_generic_socket_watch_message_and_typing_contract():
    username = "ws-contract-generic"
    _user, room, messages = await create_contract_room(
        "ws-contract-generic-room", username, message_count=31
    )
    cid = f"messaging:{room.uuid}"
    communicator, connected, _code = await connect("chat", username)
    assert connected
    assert await communicator.receive_json_from() == {
        "type": "user.join",
        "user": username,
    }

    await communicator.send_json_to({"type": "channel.watch", "cid": cid})
    initialized = await communicator.receive_json_from()
    assert set(initialized) == {
        "type",
        "cid",
        "initialized",
        "messages",
        "next",
        "members",
    }
    assert initialized["type"] == "initialized"
    assert initialized["cid"] == cid
    assert initialized["initialized"] is True
    assert len(initialized["messages"]) == 30
    assert initialized["next"] is not None
    assert {
        "id",
        "text",
        "body",
        "sent_by",
        "created_at",
        "attachments",
        "parent_id",
        "pinned",
    }.issubset(initialized["messages"][0])
    assert isinstance(initialized["members"], list)

    message_payload = await serialized_message(messages[-1].id, text="REST broadcast")
    layer = get_channel_layer()
    await layer.group_send(
        group_name_for_cid(cid),
        {
            "type": "chat.message",
            "payload": {"type": "message.new", "cid": cid, "message": message_payload},
        },
    )
    event = await communicator.receive_json_from()
    assert event["type"] == "message.new"
    assert event["cid"] == cid
    assert event["message"]["id"] == messages[-1].id
    assert event["message"]["text"] == "REST broadcast"

    await communicator.send_json_to({"type": "typing.start", "cid": cid})
    assert await communicator.receive_json_from() == {
        "type": "typing.start",
        "cid": cid,
        "user_id": username,
    }
    await communicator.send_json_to({"type": "typing.stop"})
    assert await communicator.receive_json_from() == {
        "type": "typing.stop",
        "cid": cid,
        "user_id": username,
    }
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_room_specific_socket_cid_binding_and_update_event_contracts():
    username = "ws-contract-bound"
    _user, room, messages = await create_contract_room(
        "ws-contract-bound-room", username
    )
    await create_contract_room("ws-contract-other-room", username)
    cid = f"messaging:{room.uuid}"
    communicator, connected, _code = await connect(cid, username)
    assert connected
    await communicator.receive_json_from()

    await communicator.send_json_to(
        {"type": "channel.watch", "cid": "messaging:ws-contract-other-room"}
    )
    assert await communicator.receive_json_from() == {
        "type": "error",
        "code": "cid_mismatch",
        "cid": "messaging:ws-contract-other-room",
    }

    await communicator.send_json_to({"type": "channel.watch", "cid": cid})
    assert (await communicator.receive_json_from())["type"] == "initialized"

    attachment = {
        "id": "att-contract",
        "name": "contract.txt",
        "filename": "contract.txt",
        "url": "/api/attachments/att-contract/download/",
        "uploaded_by": username,
        "legacy_placeholder": True,
        "scan_status": Message.ATTACHMENT_SCAN_PENDING,
    }
    updated_message = await serialized_message(
        messages[0].id, text="updated text", attachment=attachment
    )
    layer = get_channel_layer()
    update_payload = {
        "type": "message.updated",
        "cid": cid,
        "message": updated_message,
    }
    await layer.group_send(
        group_name_for_cid(cid),
        {"type": "chat.message", "payload": update_payload},
    )
    assert await communicator.receive_json_from() == update_payload

    read_payload = {
        "type": "message.read",
        "cid": cid,
        "user": {
            "id": username,
            "channel_last_read_at": "2026-08-06T12:00:00Z",
            "channel_unread_count": 0,
            "unread_count": 0,
            "unread_channels": 0,
            "total_unread_count": 0,
        },
        "created_at": "2026-08-06T12:00:00Z",
    }
    await layer.group_send(
        group_name_for_cid(cid),
        {"type": "chat.message", "payload": read_payload},
    )
    assert await communicator.receive_json_from() == read_payload

    deleted_payload = {
        "type": "message.deleted",
        "cid": cid,
        "message_id": str(messages[0].id),
        "deleted_by": username,
        "ts": "2026-08-06T12:01:00Z",
    }
    await layer.group_send(
        group_name_for_cid(cid),
        {"type": "chat.message", "payload": deleted_payload},
    )
    assert await communicator.receive_json_from() == deleted_payload
    await communicator.disconnect()
