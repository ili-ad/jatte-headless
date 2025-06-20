from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .models import Channel, Message, ReadState


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.channel_uuid = self.scope["url_route"]["kwargs"]["channel_uuid"]
        self.group_name = f"chat_{self.channel_uuid}"
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
        elif event_type == "markRead":
            user = content.get("user", "")
            await self._mark_read(user)
            await self.send_json({"type": "markRead", "status": "ok"})
        elif event_type == "countUnread":
            user = content.get("user", "")
            count = await self._count_unread(user)
            await self.send_json({"type": "unread.count", "unread": count})

    async def broadcast(self, event):
        await self.send_json(
            {"type": event.get("event_type", "message.new"), "text": event["text"], "user": event["user"]}
        )

    @sync_to_async
    def _get_messages(self):
        channel = Channel.objects.get(uuid=self.channel_uuid)
        return [
            {"id": m.id, "text": m.body, "user": m.sent_by}
            for m in channel.messages.order_by("id")
        ]

    @sync_to_async
    def _create_message(self, user, text):
        channel = Channel.objects.get(uuid=self.channel_uuid)
        msg = Message.objects.create(channel=channel, sent_by=user, body=text)
        return msg

    @sync_to_async
    def _mark_read(self, user):
        channel = Channel.objects.get(uuid=self.channel_uuid)
        ReadState.objects.update_or_create(
            user=user,
            channel=channel,
            defaults={"last_read": timezone.now()},
        )

    @sync_to_async
    def _count_unread(self, user):
        channel = Channel.objects.get(uuid=self.channel_uuid)
        state = ReadState.objects.filter(user=user, channel=channel).first()
        if state is None:
            return channel.messages.count()
        return channel.messages.filter(created_at__gt=state.last_read).count()
