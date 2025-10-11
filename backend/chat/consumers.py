import logging

from asgiref.sync import async_to_sync, sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.conf import settings
from urllib.parse import parse_qs
import jwt

from .models import Channel, Message, Room
from .serializers import MessageSerializer
from .utils import canonical_cid, group_name_for_cid
from .views import RoomMembersCIDView


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
        channel, _ = Channel.objects.get_or_create(
            uuid=room_uuid, defaults={"client": "stream"}
        )
        room, _ = Room.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})

        qs = list(
            Message.objects.filter(channel=channel).order_by("-id")[: message_limit + 1]
        )
        has_more = len(qs) > message_limit
        messages = qs[:message_limit]
        serializer = MessageSerializer(messages, many=True)
        message_payload = [dict(item) for item in serializer.data]
        next_cursor = messages[-1].id if has_more and messages else None

        members_view = RoomMembersCIDView()
        member_payload = members_view._collect_members(room)  # type: ignore[attr-defined]
        member_list = list(member_payload[:member_limit])

        return message_payload, next_cursor, member_list

    @staticmethod
    def _normalize_cid(cid: str | None) -> str | None:
        if not cid:
            return None
        return canonical_cid(cid)

    @staticmethod
    def _room_uuid(cid: str) -> str:
        return cid.split(":", 1)[1] if ":" in cid else cid

    @staticmethod
    def _group_name(cid: str) -> str:
        return group_name_for_cid(cid)


logger = logging.getLogger(__name__)


def broadcast_message_update(message: Message) -> None:
    """Broadcast a ``message.updated`` event for the given message."""

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        payload = MessageSerializer(message).data
        cids: list[str] = []
        for room in message.rooms.all():
            cids.append(canonical_cid(None, room_uuid=room.uuid))

        if not cids and getattr(message, "channel_id", None):
            try:
                channel_uuid = message.channel.uuid
            except Channel.DoesNotExist:  # pragma: no cover - safety guard
                channel_uuid = None
            if channel_uuid:
                cids.append(canonical_cid(None, room_uuid=channel_uuid))

        for cid in cids:
            async_to_sync(channel_layer.group_send)(
                group_name_for_cid(cid),
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "message.updated",
                        "cid": cid,
                        "message": payload,
                    },
                },
            )
    except Exception:  # pragma: no cover - defensive logging
        logger.exception("Failed to broadcast message update")
