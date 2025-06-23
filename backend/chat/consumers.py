from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
import jwt

from .models import Channel, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.cid = self.scope["url_route"]["kwargs"].get("cid")
        self.group = self.cid.replace(":", "_")
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
        self.user = "anonymous"
        if token:
            try:
                decoded = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                self.user = decoded.get("sub", "anonymous")
            except Exception:
                pass

        await self.accept()
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.channel_layer.group_send(
            self.group,
            {"type": "chat.presence", "payload": {"type": "user.join", "user": self.user}},
        )

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "message.new":
            cid = content.get("cid", f"messaging:{self.cid}")
            text = content.get("text", "")
            try:
                _type, uuid = cid.split(":", 1)
                channel = await sync_to_async(Channel.objects.get)(uuid=uuid)
            except Exception:
                channel = None
            if channel:
                await sync_to_async(Message.objects.create)(
                    channel=channel, body=text, sent_by=self.user
                )
            payload = {"type": "message.new", "cid": cid, "text": text, "user": self.user}
            await self.channel_layer.group_send(
                self.group,
                {"type": "chat.message", "payload": payload},
            )
        elif msg_type in {"typing.start", "typing.stop"}:
            await self.channel_layer.group_send(
                self.group,
                {"type": "chat.typing", "payload": {"type": msg_type, "user_id": self.user}},
            )

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def chat_typing(self, event):
        await self.send_json(event["payload"])

    async def chat_presence(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)
        await self.channel_layer.group_send(
            self.group,
            {"type": "chat.presence", "payload": {"type": "user.leave", "user": self.user}},
        )
        await super().disconnect(code)
