from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from accounts.middleware import get_user as supabase_verify
from .models import Channel, Message


@database_sync_to_async
def _get_or_create_channel(uuid: str):
    return Channel.objects.get_or_create(uuid=uuid, defaults={"client": "local"})[0]


@database_sync_to_async
def _create_message(channel: Channel, user: str, text: str):
    return Message.objects.create(channel=channel, sent_by=user, body=text)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.rooms = set()
        self.user = None

    async def connect(self):
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
        if not token:
            await self.close()
            return
        self.user = await supabase_verify(token)
        await self.accept()

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "message.new":
            cid = content.get("cid")
            room = cid.split(":")[1]
            if room not in self.rooms:
                await self.channel_layer.group_add(room, self.channel_name)
                self.rooms.add(room)
            channel = await _get_or_create_channel(room)
            msg = await _create_message(channel, self.user.username, content.get("text", ""))
            await self.channel_layer.group_send(
                room,
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "message.new",
                        "cid": cid,
                        "text": msg.body,
                        "user": msg.sent_by,
                    },
                },
            )

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        for room in self.rooms:
            await self.channel_layer.group_discard(room, self.channel_name)
        await super().disconnect(code)
