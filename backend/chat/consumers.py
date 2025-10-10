from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from urllib.parse import parse_qs
import jwt

from .models import Channel, Message, Room
from .serializers import MessageSerializer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Minimal websocket consumer that mirrors Stream's channel API."""

    lobby_group = "ws_chat_lobby"

    async def connect(self):
        self.joined_cids: set[str] = set()
        self.user = "anonymous"
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
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
        await self.channel_layer.group_add(self.lobby_group, self.channel_name)
        await self.channel_layer.group_send(
            self.lobby_group,
            {"type": "chat.presence", "payload": {"type": "user.join", "user": self.user}},
        )

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")
        if msg_type == "channel.watch":
            await self._handle_channel_watch(content)
        elif msg_type == "message.new":
            await self._handle_message_new(content)
        elif msg_type in {"typing.start", "typing.stop"}:
            await self._handle_typing_event(msg_type, content)

    async def chat_message(self, event):
        await self.send_json(event["payload"])

    async def chat_typing(self, event):
        await self.send_json(event["payload"])

    async def chat_presence(self, event):
        await self.send_json(event["payload"])

    async def disconnect(self, code):
        for cid in list(self.joined_cids):
            await self.channel_layer.group_discard(self._group_name(cid), self.channel_name)
        await self.channel_layer.group_discard(self.lobby_group, self.channel_name)
        await self.channel_layer.group_send(
            self.lobby_group,
            {"type": "chat.presence", "payload": {"type": "user.leave", "user": self.user}},
        )
        await super().disconnect(code)

    async def _handle_channel_watch(self, content: dict) -> None:
        cid = self._normalize_cid(content.get("cid"))
        if not cid:
            await self.send_json({"type": "error", "code": "invalid_cid"})
            return

        try:
            messages, next_cursor, members = await sync_to_async(self._room_state)(cid)
        except Exception:
            await self.send_json({"type": "error", "code": "state_unavailable", "cid": cid})
            return

        payload = {
            "type": "initialized",
            "cid": cid,
            "initialized": True,
            "messages": messages,
            "next": next_cursor,
            "members": members,
        }
        await self.send_json(payload)

        group_name = self._group_name(cid)
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.joined_cids.add(cid)

    async def _handle_message_new(self, content: dict) -> None:
        cid = self._normalize_cid(content.get("cid") or next(iter(self.joined_cids), None))
        if not cid:
            return

        text = content.get("text", "")

        await self._create_message(cid, text)

        payload = {"type": "message.new", "cid": cid, "text": text, "user": self.user}
        await self.channel_layer.group_send(
            self._group_name(cid),
            {"type": "chat.message", "payload": payload},
        )

    async def _handle_typing_event(self, msg_type: str, content: dict) -> None:
        cid = self._normalize_cid(content.get("cid") or next(iter(self.joined_cids), None))
        group = self._group_name(cid) if cid else self.lobby_group
        payload = {"type": msg_type, "user_id": self.user}
        if cid:
            payload["cid"] = cid
        await self.channel_layer.group_send(
            group,
            {"type": "chat.typing", "payload": payload},
        )

    async def _create_message(self, cid: str, text: str) -> Message:
        def _create() -> Message:
            room_uuid = self._room_uuid(cid)
            channel, _ = Channel.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})
            room, _ = Room.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})
            message = Message.objects.create(channel=channel, body=text, sent_by=self.user)
            room.messages.add(message)
            return message

        return await sync_to_async(_create)()

    def _room_state(self, cid: str, message_limit: int = 30, member_limit: int = 50):
        room_uuid = self._room_uuid(cid)
        channel, _ = Channel.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})
        room, _ = Room.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})

        qs = list(
            Message.objects.filter(channel=channel).order_by("-id")[: message_limit + 1]
        )
        has_more = len(qs) > message_limit
        messages = qs[:message_limit]
        serializer = MessageSerializer(messages, many=True)
        message_payload = [dict(item) for item in serializer.data]
        next_cursor = messages[-1].id if has_more and messages else None

        names: set[str] = set(
            Message.objects.filter(channel=channel).values_list("sent_by", flat=True)
        )
        names.update(room.messages.values_list("sent_by", flat=True))
        if room.client:
            names.add(room.client)
        if room.agent:
            names.add(room.agent.username)
        if self.user and self.user != "anonymous":
            names.add(self.user)

        member_list = [
            {"user_id": name, "role": "member", "banned": False}
            for name in sorted(n for n in names if n)[:member_limit]
        ]

        return message_payload, next_cursor, member_list

    @staticmethod
    def _normalize_cid(cid: str | None) -> str | None:
        if not cid:
            return None
        if ":" not in cid:
            cid = f"messaging:{cid}"
        return cid

    @staticmethod
    def _room_uuid(cid: str) -> str:
        return cid.split(":", 1)[1] if ":" in cid else cid

    @staticmethod
    def _group_name(cid: str) -> str:
        return f"channel_{cid.replace(':', '_')}"
