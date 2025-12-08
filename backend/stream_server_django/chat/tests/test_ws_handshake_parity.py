import pytest
import jwt
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from urllib.parse import quote

from stream_server_django.chat.models import Channel, Message, Room
from jatte.asgi import application


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    ROOT_URLCONF="chat.tests.ws_test_urls",
)
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_ws_handshake_and_event_parity():
    User = get_user_model()
    user = await sync_to_async(User.objects.create_user)(
        username="tester",
        email="tester@example.com",
        password="password",
    )
    target_user = await sync_to_async(User.objects.create_user)(
        username="target",
        email="target@example.com",
        password="password",
    )

    channel = await sync_to_async(Channel.objects.create)(uuid="general", client="stream")
    room = await sync_to_async(Room.objects.create)(
        uuid="general", client="stream", agent=user
    )
    seed_message = await sync_to_async(Message.objects.create)(
        channel=channel,
        body="seed",
        sent_by=user.username,
    )
    await sync_to_async(room.messages.add)(seed_message)

    token = jwt.encode(
        {"sub": str(user.id), "email": user.email},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )
    communicator = WebsocketCommunicator(application, f"/ws/chat/?token={token}")
    connected, _ = await communicator.connect()
    assert connected

    join = await communicator.receive_json_from()
    assert join == {"type": "user.join", "user": str(user.id)}

    cid = f"messaging:{channel.uuid}"
    await communicator.send_json_to({"type": "channel.watch", "cid": cid})

    watch = await communicator.receive_json_from()
    assert watch["type"] == "initialized"
    assert watch["initialized"] is True
    assert watch["cid"] == cid
    assert isinstance(watch["messages"], list) and watch["messages"], "expected messages"
    assert any(message["body"] == "seed" for message in watch["messages"])
    assert watch["next"] is None
    assert isinstance(watch["members"], list) and watch["members"]
    assert any(member.get("user_id") == user.id for member in watch["members"])

    async def api_call(method: str, path: str, data=None):
        def _request():
            client = APIClient()
            client.force_authenticate(user=user)
            func = getattr(client, method)
            if data is None:
                return func(path)
            return func(path, data, format="json")

        return await sync_to_async(_request, thread_sensitive=True)()

    message_create = await api_call(
        "post",
        f"/api/rooms/{room.uuid}/messages/",
        {"text": "from http"},
    )
    assert message_create.status_code == 201
    created_message_id = str(message_create.data["id"])

    event = await communicator.receive_json_from()
    assert event["type"] == "message.new"
    assert event["cid"] == cid
    assert event["message"]["id"] == int(created_message_id)

    update_path = f"/api/rooms/{quote(cid, safe='')}/messages/{created_message_id}/"
    message_update = await api_call(
        "patch",
        update_path,
        {"text": "updated", "pinned": True},
    )
    assert message_update.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "message.updated"
    assert event["cid"] == cid
    assert event["message"]["text"] == "updated"
    assert event["message"]["pinned"] is True

    reaction_path = f"/api/messages/{created_message_id}/reactions/like/"
    reaction_new = await api_call("post", reaction_path, {})
    assert reaction_new.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "reaction.new"
    assert event["cid"] == cid
    assert event["message_id"] == created_message_id

    reaction_delete = await api_call("delete", reaction_path)
    assert reaction_delete.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "reaction.deleted"
    assert event["cid"] == cid
    assert event["message_id"] == created_message_id

    poll_create = await api_call(
        "post",
        "/polls/",
        {"cid": cid, "question": "Lunch?", "options": ["Yes", "No"]},
    )
    assert poll_create.status_code == 201
    poll_payload = poll_create.data["poll"]
    poll_id = poll_payload["poll_id"]
    option_ids = [option["id"] for option in poll_payload["options"]]

    vote_cast = await api_call(
        "post",
        f"/polls/{poll_id}/options/{option_ids[0]}/votes/",
        {},
    )
    assert vote_cast.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "poll.vote_casted"
    assert event["cid"] == cid
    assert event["poll_id"] == poll_id
    assert event["option_id"] == option_ids[0]

    vote_change = await api_call(
        "post",
        f"/polls/{poll_id}/options/{option_ids[1]}/votes/",
        {},
    )
    assert vote_change.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "poll.vote_changed"
    assert event["cid"] == cid
    assert event["poll_id"] == poll_id
    assert event["from_option_id"] == option_ids[0]
    assert event["to_option_id"] == option_ids[1]

    vote_remove = await api_call(
        "delete",
        f"/polls/{poll_id}/options/{option_ids[1]}/votes/",
    )
    assert vote_remove.status_code == 200

    event = await communicator.receive_json_from()
    assert event["type"] == "poll.vote_removed"
    assert event["cid"] == cid
    assert event["poll_id"] == poll_id

    delete_message = await api_call("delete", update_path)
    assert delete_message.status_code == 204

    event = await communicator.receive_json_from()
    assert event["type"] == "message.deleted"
    assert event["cid"] == cid
    assert event["message_id"] == created_message_id

    mute_path = f"/api/rooms/{quote(cid, safe='')}/mutes/"
    mute_response = await api_call("post", mute_path, {"user_id": target_user.id})
    assert mute_response.status_code == 201

    event = await communicator.receive_json_from()
    assert event["type"] == "member.muted"
    assert event["cid"] == cid
    assert event["target_user"] == target_user.id
    assert event["muted"] is True

    reminder_path = f"/api/rooms/{quote(cid, safe='')}/reminders/"
    reminder_payload = {
        "remind_at": timezone.now().isoformat(),
        "message_id": seed_message.id,
        "note": "follow up",
    }
    reminder_response = await api_call("post", reminder_path, reminder_payload)
    assert reminder_response.status_code == 201

    event = await communicator.receive_json_from()
    assert event["type"] == "reminder.new"
    assert event["cid"] == cid
    assert event["reminder"]["note"] == "follow up"

    await communicator.disconnect()
