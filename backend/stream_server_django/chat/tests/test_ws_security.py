import time

import jwt
import pytest
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.test import override_settings

from stream_server_django.chat.models import Message, Room
from stream_server_django.chat.routing import websocket_urlpatterns
from stream_server_django.chat.utils import group_name_for_cid


application = URLRouter(websocket_urlpatterns)


def make_token(sub="member", **claims):
    payload = {"sub": sub, "email": f"{sub}@example.com", **claims}
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


async def connect(room_key="chat", token=None):
    suffix = f"?token={token}" if token is not None else ""
    communicator = WebsocketCommunicator(application, f"/ws/{room_key}/{suffix}")
    connected, code = await communicator.connect()
    return communicator, connected, code


async def create_room(uuid, client):
    return await sync_to_async(Room.objects.create)(uuid=uuid, client=client)


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    SUPABASE_JWKS_URL=None,
)
@pytest.mark.parametrize(
    "token",
    [
        None,
        "not-a-jwt",
        jwt.encode(
            {"sub": "expired", "exp": int(time.time()) - 120},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        ),
        jwt.encode({"sub": "wrong-signature"}, "different-secret", algorithm="HS256"),
        jwt.encode({"email": "missing-sub@example.com"}, settings.SUPABASE_JWT_SECRET, algorithm="HS256"),
    ],
    ids=["missing", "malformed", "expired", "invalid-signature", "missing-sub"],
)
async def test_websocket_rejects_invalid_authentication_before_accept(token):
    communicator, connected, code = await connect(token=token)
    assert not connected
    assert code == 4401
    await communicator.wait()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_valid_token_connects_and_generic_chat_route_is_preserved():
    communicator, connected, _ = await connect(token=make_token())
    assert connected
    assert await communicator.receive_json_from() == {"type": "user.join", "user": "member"}
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_member_can_watch_but_nonmember_receives_no_room_state():
    await create_room("allowed", "member")
    await create_room("denied", "someone-else")

    member, connected, _ = await connect(token=make_token())
    assert connected
    await member.receive_json_from()
    await member.send_json_to({"type": "channel.watch", "cid": "messaging:allowed"})
    initialized = await member.receive_json_from()
    assert initialized["type"] == "initialized"
    assert initialized["cid"] == "messaging:allowed"
    assert set(initialized) >= {"messages", "next", "members"}

    nonmember, connected, _ = await connect(token=make_token("outsider"))
    assert connected
    await nonmember.receive_json_from()
    await nonmember.send_json_to({"type": "channel.watch", "cid": "messaging:denied"})
    denied = await nonmember.receive_json_from()
    assert denied == {
        "type": "error",
        "code": "forbidden",
        "cid": "messaging:denied",
    }
    assert "messages" not in denied
    assert "members" not in denied

    await nonmember.send_json_to(
        {"type": "message.new", "cid": "messaging:denied", "text": "blocked"}
    )
    assert await nonmember.receive_json_from() == {
        "type": "error",
        "code": "not_watched",
        "cid": "messaging:denied",
    }
    assert await sync_to_async(Message.objects.count)() == 0

    await member.disconnect()
    await nonmember.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_send_requires_authorized_watch_and_failed_send_has_no_side_effects():
    await create_room("send-room", "member")
    communicator, connected, _ = await connect(token=make_token())
    assert connected
    await communicator.receive_json_from()

    await communicator.send_json_to(
        {"type": "message.new", "cid": "messaging:send-room", "text": "blocked"}
    )
    assert await communicator.receive_json_from() == {
        "type": "error",
        "code": "not_watched",
        "cid": "messaging:send-room",
    }
    assert await sync_to_async(Message.objects.count)() == 0
    assert await communicator.receive_nothing(timeout=0.05)

    await communicator.send_json_to({"type": "channel.watch", "cid": "messaging:send-room"})
    assert (await communicator.receive_json_from())["type"] == "initialized"
    await communicator.send_json_to(
        {"type": "message.new", "text": "allowed"}
    )
    event = await communicator.receive_json_from()
    assert event == {
        "type": "message.new",
        "cid": "messaging:send-room",
        "text": "allowed",
        "user": "member",
    }
    assert await sync_to_async(Message.objects.count)() == 1
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_room_bound_route_rejects_watch_and_send_cid_mismatch():
    await create_room("room-a", "member")
    await create_room("room-b", "member")
    communicator, connected, _ = await connect(
        room_key="messaging:room-a", token=make_token()
    )
    assert connected
    await communicator.receive_json_from()

    await communicator.send_json_to({"type": "channel.watch", "cid": "messaging:room-b"})
    assert (await communicator.receive_json_from())["code"] == "cid_mismatch"

    await communicator.send_json_to({"type": "channel.watch", "cid": "messaging:room-a"})
    assert (await communicator.receive_json_from())["type"] == "initialized"

    await communicator.send_json_to(
        {"type": "message.new", "cid": "messaging:room-b", "text": "pivot"}
    )
    assert (await communicator.receive_json_from())["code"] == "cid_mismatch"
    assert await sync_to_async(Message.objects.count)() == 0
    await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_messages_and_typing_do_not_cross_room_groups():
    await create_room("room-a", "member-a")
    await create_room("room-b", "member-b")

    client_a, connected, _ = await connect(
        room_key="messaging:room-a", token=make_token("member-a")
    )
    assert connected
    await client_a.receive_json_from()
    await client_a.send_json_to({"type": "channel.watch", "cid": "messaging:room-a"})
    await client_a.receive_json_from()

    client_b, connected, _ = await connect(
        room_key="messaging:room-b", token=make_token("member-b")
    )
    assert connected
    await client_b.receive_json_from()
    await client_b.send_json_to({"type": "channel.watch", "cid": "messaging:room-b"})
    await client_b.receive_json_from()

    await client_b.send_json_to(
        {"type": "message.new", "cid": "messaging:room-b", "text": "room b"}
    )
    assert (await client_b.receive_json_from())["type"] == "message.new"
    assert await client_a.receive_nothing(timeout=0.05)

    await client_b.send_json_to({"type": "typing.start", "cid": "messaging:room-b"})
    typing = await client_b.receive_json_from()
    assert typing == {
        "type": "typing.start",
        "cid": "messaging:room-b",
        "user_id": "member-b",
    }
    assert await client_a.receive_nothing(timeout=0.05)

    await client_a.disconnect()
    await client_b.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_connection_presence_acknowledgement_is_not_broadcast_globally():
    first, connected, _ = await connect(token=make_token("first"))
    assert connected
    assert (await first.receive_json_from())["user"] == "first"

    second, connected, _ = await connect(token=make_token("second"))
    assert connected
    assert (await second.receive_json_from())["user"] == "second"
    assert await first.receive_nothing(timeout=0.05)

    await first.disconnect()
    await second.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
async def test_group_events_are_dropped_if_room_access_is_revoked():
    room = await create_room("revoked", "member")
    communicator, connected, _ = await connect(token=make_token())
    assert connected
    await communicator.receive_json_from()
    await communicator.send_json_to({"type": "channel.watch", "cid": "messaging:revoked"})
    assert (await communicator.receive_json_from())["type"] == "initialized"

    room.client = "someone-else"
    await sync_to_async(room.save)(update_fields=["client"])
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        group_name_for_cid("messaging:revoked"),
        {
            "type": "chat.message",
            "payload": {
                "type": "message.new",
                "cid": "messaging:revoked",
                "text": "must not leak",
            },
        },
    )
    assert await communicator.receive_nothing(timeout=0.05)
    await communicator.disconnect()
