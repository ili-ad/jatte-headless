import logging
import time

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.conf import settings
from urllib.parse import parse_qs
from rest_framework.exceptions import AuthenticationFailed

from stream_server_django.accounts_supabase.authentication import (
    authenticate_supabase_token,
)
from stream_server_django.rooms.utils import user_has_room_access

from .models import Channel, Message, Room
from .serializers import MessageSerializer
from .utils import canonical_cid, group_name_for_cid
from .views import RoomMembersCIDView


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Minimal websocket consumer that mirrors Stream's channel API."""

    unauthenticated_close_code = 4401
    # Legacy integration tests use /ws/chat/ as a generic socket. The active
    # frontend uses room-specific keys. Generic sockets still authorize each
    # operation and may act only on rooms successfully watched by this client.
    generic_room_keys = {"chat"}

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        """Reject oversized events before JSON decoding or dispatch."""

        max_bytes = int(getattr(settings, "WS_MAX_EVENT_BYTES", 256 * 1024))
        payload_size = (
            len(bytes_data)
            if bytes_data is not None
            else len((text_data or "").encode("utf-8"))
        )
        if payload_size > max_bytes:
            logger.warning(
                "websocket_message_too_large=true user_id=%s payload_bytes=%s",
                self.user,
                payload_size,
            )
            await self.close(code=1009)
            return
        await super().receive(text_data=text_data, bytes_data=bytes_data, **kwargs)

    async def connect(self):
        self.joined_cids: set[str] = set()
        self.authenticated_user = None
        self.user = ""
        self._bucket_capacity = max(1, getattr(settings, "WS_BUCKET_CAPACITY", 30))
        self._bucket_refill_per_sec = max(
            0.0, float(getattr(settings, "WS_BUCKET_REFILL_PER_SEC", 5))
        )
        self._bucket_tokens = float(self._bucket_capacity)
        self._bucket_last_refill = time.monotonic()
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]
        if not token:
            await self.close(code=self.unauthenticated_close_code)
            return

        try:
            self.authenticated_user = await database_sync_to_async(
                authenticate_supabase_token
            )(token)
        except AuthenticationFailed:
            await self.close(code=self.unauthenticated_close_code)
            return

        self.user = self.authenticated_user.username
        route_key = self.scope.get("url_route", {}).get("kwargs", {}).get("room_key")
        self.route_key = str(route_key or "").strip()
        self.route_cid = (
            None
            if self.route_key in self.generic_room_keys
            else self._normalize_cid(self.route_key)
        )

        await self.accept()
        # Preserve the existing acknowledgement for this client only. Global
        # lobby presence is intentionally disabled to prevent cross-room leaks.
        await self.send_json({"type": "user.join", "user": self.user})

    async def receive_json(self, content, **kwargs):
        if not self._consume_ws_token():
            cid = content.get("cid") or next(iter(self.joined_cids), None)
            logger.warning(
                "rate_limited=true user_id=%s cid=%s", self.user, cid
            )
            await self.close(code=getattr(settings, "WS_RATE_LIMIT_CLOSE_CODE", 4408))
            return

        msg_type = content.get("type")
        if msg_type == "channel.watch":
            await self._handle_channel_watch(content)
        elif msg_type == "message.new":
            await self._handle_message_new(content)
        elif msg_type in {"typing.start", "typing.stop"}:
            await self._handle_typing_event(msg_type, content)

    def _consume_ws_token(self) -> bool:
        now = time.monotonic()
        elapsed = now - self._bucket_last_refill
        if elapsed > 0:
            self._bucket_tokens = min(
                float(self._bucket_capacity),
                self._bucket_tokens + elapsed * self._bucket_refill_per_sec,
            )
            self._bucket_last_refill = now

        if self._bucket_tokens >= 1:
            self._bucket_tokens -= 1
            return True
        return False

    async def chat_message(self, event):
        await self._send_authorized_room_event(event)

    async def chat_typing(self, event):
        await self._send_authorized_room_event(event)

    async def chat_presence(self, event):
        await self._send_authorized_room_event(event)

    async def disconnect(self, code):
        for cid in list(self.joined_cids):
            await self.channel_layer.group_discard(self._group_name(cid), self.channel_name)
        await super().disconnect(code)

    async def _handle_channel_watch(self, content: dict) -> None:
        cid = await self._operation_cid(content)
        if not cid:
            return

        try:
            messages, next_cursor, members = await database_sync_to_async(
                self._authorized_room_state
            )(cid)
        except (Room.DoesNotExist, PermissionError):
            await self._send_forbidden(cid)
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
        cid = await self._operation_cid(content, require_watched=True)
        if not cid:
            return

        text = content.get("text", "")

        try:
            await database_sync_to_async(self._create_message)(cid, text)
        except (Room.DoesNotExist, PermissionError):
            await self._send_forbidden(cid)
            return

        payload = {"type": "message.new", "cid": cid, "text": text, "user": self.user}
        await self.channel_layer.group_send(
            self._group_name(cid),
            {"type": "chat.message", "payload": payload},
        )

    async def _handle_typing_event(self, msg_type: str, content: dict) -> None:
        cid = await self._operation_cid(content, require_watched=True)
        if not cid:
            return
        if not await database_sync_to_async(self._can_access_room)(cid):
            await self._send_forbidden(cid)
            return

        group = self._group_name(cid)
        payload = {"type": msg_type, "user_id": self.user}
        payload["cid"] = cid
        await self.channel_layer.group_send(
            group,
            {"type": "chat.typing", "payload": payload},
        )

    def _create_message(self, cid: str, text: str) -> Message:
        room_uuid = self._room_uuid(cid)
        room = Room.objects.get(uuid=room_uuid)
        if not user_has_room_access(self.authenticated_user, room):
            raise PermissionError
        channel, _ = Channel.objects.get_or_create(
            uuid=room_uuid, defaults={"client": room.client or self.user}
        )
        message = Message.objects.create(channel=channel, body=text, sent_by=self.user)
        room.messages.add(message)
        return message

    def _authorized_room_state(
        self, cid: str, message_limit: int = 30, member_limit: int = 50
    ):
        room_uuid = self._room_uuid(cid)
        room = Room.objects.get(uuid=room_uuid)
        if not user_has_room_access(self.authenticated_user, room):
            raise PermissionError

        qs = list(
            room.messages.order_by("-id")[: message_limit + 1]
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

    def _can_access_room(self, cid: str) -> bool:
        try:
            room = Room.objects.get(uuid=self._room_uuid(cid))
        except Room.DoesNotExist:
            return False
        return user_has_room_access(self.authenticated_user, room)

    async def _operation_cid(
        self, content: dict, *, require_watched: bool = False
    ) -> str | None:
        raw_cid = content.get("cid") or self.route_cid
        if not raw_cid and require_watched:
            # Preserve the generic Stream-compatible socket behavior: after a
            # successful watch, send/typing frames may omit cid. The fallback
            # is constrained to a room this socket has already authorized.
            raw_cid = next(iter(self.joined_cids), None)
        cid = self._normalize_cid(raw_cid) if isinstance(raw_cid, str) else None
        if not cid:
            await self.send_json({"type": "error", "code": "invalid_cid"})
            return None
        if self.route_cid and cid != self.route_cid:
            await self.send_json({"type": "error", "code": "cid_mismatch", "cid": cid})
            return None
        if require_watched and cid not in self.joined_cids:
            await self.send_json({"type": "error", "code": "not_watched", "cid": cid})
            return None
        return cid

    async def _send_forbidden(self, cid: str) -> None:
        await self.send_json({"type": "error", "code": "forbidden", "cid": cid})

    async def _send_authorized_room_event(self, event: dict) -> None:
        """Forward a group event only while this socket remains authorized."""

        payload = event.get("payload") or {}
        raw_cid = payload.get("cid")
        cid = self._normalize_cid(raw_cid) if isinstance(raw_cid, str) else None
        if not cid or cid not in self.joined_cids:
            return
        if not await database_sync_to_async(self._can_access_room)(cid):
            return
        await self.send_json(payload)

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
