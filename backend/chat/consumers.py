from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Room, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_uuid = self.scope["url_route"]["kwargs"]["room_uuid"]
        self.group_name = f"chat_{self.room_uuid}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")
        if event_type == "channel.watch":
            messages = await self._get_messages()
            await self.send_json({"type": "channel.watch", "messages": messages})
        elif event_type == "sendMessage":
            text = content.get("text", "")
            user = content.get("user", "")
            msg = await self._create_message(user, text)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast",
                    "text": msg.body,
                    "user": msg.sent_by,
                    "event_type": "message.new",
                },
            )

    async def broadcast(self, event):
        await self.send_json(
            {"type": event.get("event_type", "message.new"), "text": event["text"], "user": event["user"]}
        )

    @sync_to_async
    def _get_messages(self):
        room = Room.objects.get(uuid=self.room_uuid)
        return [
            {"id": m.id, "text": m.body, "user": m.sent_by}
            for m in room.messages.order_by("id")
        ]

    @sync_to_async
    def _create_message(self, user, text):
        room = Room.objects.get(uuid=self.room_uuid)
        msg = Message.objects.create(sent_by=user, body=text)
        room.messages.add(msg)
        return msg
