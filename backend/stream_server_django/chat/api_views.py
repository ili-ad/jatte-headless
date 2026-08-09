import json
import hashlib
import logging
import uuid
from datetime import timedelta
from urllib.parse import urlparse

import redis
from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.accounts_supabase.utils import (
    is_at_least_guest_identity,
    require_permanent_supabase_user,
)
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db import transaction
from django.db.models import Q
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.common.identity import ChatIdentity, get_chat_identity
from stream_server_django.chatcore.services import should_gate_first_message
from stream_server_django.polls.models import (
    Poll as RoomPoll,
    PollOption as RoomPollOption,
    PollVote as RoomPollVote,
)
from stream_server_django.polls.serializers import (
    PollCreateSerializer as RoomPollCreateSerializer,
    PollOptionCreateSerializer as RoomPollOptionCreateSerializer,
)
from stream_server_django.polls.views import (
    _authorized_poll,
    _authorized_room,
    _can_delete_poll,
)
from stream_server_django.rooms.utils import (
    can_admin_room,
    can_mutate_message,
    get_room_or_404,
    is_public_agent_room,
    require_message_room_access,
    require_room_access,
    rooms_accessible_to_user,
    user_has_room_access,
    user_is_message_author,
    user_is_room_participant,
)
from common.throttling import (
    MessageBurstRateThrottle,
    MessageSustainedRateThrottle,
    ReactionBurstRateThrottle,
    ReactionSustainedRateThrottle,
)

try:
    from stream_server_django.chat_addons.agent.utils import (
        agent_enabled_for_room,
        agent_user_id_for_room,
    )
except Exception:  # pragma: no cover - optional dependency in certain test envs
    agent_enabled_for_room = None  # type: ignore[assignment]
    agent_user_id_for_room = None  # type: ignore[assignment]

from .mixins import RoomFromCIDMixin
from .attachment_security import (
    attachment_download_url as _attachment_download_url,
    attachment_integrity_is_valid,
    private_attachment_url as _private_attachment_url,
    sign_attachment_metadata as _sign_attachment_metadata,
)
from .models import (
    Channel,
    Draft,
    Flag,
    Message,
    Notification,
    Pin,
    Reaction,
    ReadState,
    Reminder,
    Room,
    RoomMemberMute,
    RoomMute,
    UserMute,
)
from .consumers import broadcast_message_update
from .serializers import (
    DraftSerializer,
    FlagSerializer,
    MessageSerializer,
    MessageUpdateSerializer,
    MuteStatusSerializer,
    NotificationSerializer,
    PinSerializer,
    ReactionSerializer,
    RegisterSubscriptionsSerializer,
    ReminderCreateSerializer,
    ReminderSerializer,
    RoomMemberMuteCreateSerializer,
    RoomMemberMuteSerializer,
    RoomSerializer,
    UserMuteUnmuteSerializer,
)
from .tasks import scan_attachment
from .storage.gcs import (
    blob_name_for,
    download_blob,
    generate_signed_url,
    load_iam_signing_identity,
    load_service_account,
    safe_filename,
)
from .utils import canonical_cid, group_name_for_cid
from .webpush import broadcast_subscriptions_registered
from .search import SearchTimeoutError, search_messages

logger = logging.getLogger(__name__)


def _user_can_access_room(user, room) -> bool:
    """Compatibility alias for the centralized room-access policy."""

    return user_has_room_access(user, room)


def _message_from_identifier(message_id: str) -> Message:
    """Return a message for either numeric or string identifiers."""

    try:
        message_pk = int(message_id)
    except (TypeError, ValueError) as exc:
        raise Http404 from exc

    return get_object_or_404(Message, id=message_pk)


def _message_and_room_for_user(user, message_id: str) -> tuple[Message, Room]:
    """Resolve a direct message ID through an accessible parent room."""

    message = _message_from_identifier(message_id)
    room = require_message_room_access(user, message)
    return message, room


def _broadcast_to_cid(cid: str, payload: dict) -> None:
    """Send a payload to subscribers of the given ``cid``."""

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        canonical = canonical_cid(cid)
        payload = dict(payload)
        payload.setdefault("cid", canonical)
        async_to_sync(channel_layer.group_send)(
            group_name_for_cid(canonical),
            {"type": "chat.message", "payload": payload},
        )
    except Exception:
        pass


def _broadcast_reminder_created(room, cid: str, reminder_data: dict) -> None:
    """Notify channel subscribers that a reminder was created."""

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        canonical = canonical_cid(cid, room_uuid=room.uuid)
        async_to_sync(channel_layer.group_send)(
            group_name_for_cid(canonical),
            {
                "type": "chat.message",
                "payload": {
                    "type": "reminder.new",
                    "cid": canonical,
                    "reminder": reminder_data,
                },
            },
        )
    except Exception:
        pass


def _upload_session_key(upload_id: str) -> str:
    return f"chat:upload:{upload_id}"


def _store_upload_session(upload_id: str, data: dict) -> None:
    ttl = getattr(settings, "CHAT_ATTACHMENTS_UPLOAD_TTL_SECONDS", 600)
    ttl = max(60, int(ttl or 0))
    payload = json.dumps(data)
    try:
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True,
        )
        r.setex(_upload_session_key(upload_id), ttl, payload)
        return
    except Exception:
        logger.debug("Falling back to cache for upload session", exc_info=True)
    cache.set(_upload_session_key(upload_id), data, ttl)


def _load_upload_session(upload_id: str) -> dict | None:
    key = _upload_session_key(upload_id)
    try:
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True,
        )
        raw = r.get(key)
    except Exception:
        raw = None
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Invalid upload session payload for %s", upload_id)
            return None
    cached = cache.get(key)
    if isinstance(cached, dict):
        return cached
    return None


def _delete_upload_session(upload_id: str) -> None:
    key = _upload_session_key(upload_id)
    try:
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True,
        )
        r.delete(key)
    except Exception:
        pass
    cache.delete(key)


class SearchMessagesView(APIView):
    """Perform full-text search across chat messages."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):  # noqa: D401 - inherited docstring sufficient
        identity = get_chat_identity(request)
        query = request.query_params.get("q", "")
        if not isinstance(query, str):
            query = ""
        trimmed_query = query.strip()
        if len(trimmed_query) < 2:
            return Response(
                {"detail": "Query must be at least 2 characters"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        limit_param = request.query_params.get("limit")
        try:
            limit = int(limit_param) if limit_param is not None else 20
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid limit"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        if limit <= 0:
            return Response(
                {"detail": "limit must be positive"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        limit = min(limit, 50)

        cid = request.query_params.get("cid")
        before = request.query_params.get("before")

        allowed_uuids: list[str] | None
        if cid:
            canonical = canonical_cid(cid)
            try:
                _, room_uuid = canonical.split(":", 1)
            except ValueError:
                return Response(
                    {"detail": "Invalid cid"},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            room = get_object_or_404(Room, uuid=room_uuid)
            if not _user_can_access_room(identity.user, room):
                raise PermissionDenied()
            allowed_uuids = [room.uuid]
        else:
            if identity.is_staff or identity.is_superuser:
                allowed_uuids = None
            else:
                rooms = rooms_accessible_to_user(identity.user).values_list(
                    "uuid", flat=True
                )
                allowed_uuids = list(rooms)
                if not allowed_uuids:
                    return Response({"results": [], "next": None})

        try:
            results, next_cursor = search_messages(
                query=trimmed_query,
                limit=limit,
                before=before,
                cid=cid,
                allowed_channel_uuids=allowed_uuids,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except SearchTimeoutError:
            logger.warning("messages search timed out for user %s", identity.user)
            return Response(
                {"detail": "Search timed out"},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )

        return Response({"results": results, "next": next_cursor})


class RoomListCreateView(generics.ListCreateAPIView):
    serializer_class = RoomSerializer
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"

    def get_queryset(self):
        return rooms_accessible_to_user(self.request.user)

    def perform_create(self, serializer):
        identity = get_chat_identity(self.request)
        serializer.save(client=identity.username)


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoomSerializer
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"

    def get_queryset(self):
        return rooms_accessible_to_user(self.request.user)

    def _require_admin(self):
        room = self.get_object()
        if not can_admin_room(self.request.user, room):
            raise PermissionDenied()
        return room

    def update(self, request, *args, **kwargs):
        self._require_admin()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_admin()
        return super().destroy(request, *args, **kwargs)


class RoomMessageListCreateView(RoomFromCIDMixin, generics.ListCreateAPIView):
    """List and create messages for a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer
    throttle_classes = [MessageBurstRateThrottle, MessageSustainedRateThrottle]

    def get_throttles(self):  # type: ignore[override]
        if self.request.method.upper() != "POST":
            return []
        return super().get_throttles()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update(
            {
                "attachment_room": self.get_room(),
                "attachment_user": self.request.user,
            }
        )
        return context

    def get_room(self):
        cid = self.kwargs.get("cid")
        if cid is not None:
            try:
                _, room_uuid = cid.split(":", 1)
            except ValueError:
                room_uuid = cid
        else:
            room_uuid = self.kwargs["room_uuid"]
        return RoomFromCIDMixin.get_room(self, room_uuid)

    def get_queryset(self):
        room = self.get_room()
        require_room_access(self.request.user, room)
        qs = room.messages.order_by("-id")
        identity = get_chat_identity(self.request)
        include_hidden_value = self.request.query_params.get("include_hidden")
        include_hidden = (
            isinstance(include_hidden_value, str)
            and include_hidden_value.lower() in {"1", "true", "yes"}
        )
        if not (can_admin_room(identity.user, room) and include_hidden):
            qs = qs.filter(hidden=False)
        before = self.request.query_params.get("before")
        if before:
            try:
                before_id = int(before)
            except ValueError:
                return qs.none()
            if not room.messages.filter(id=before_id).exists():
                raise serializers.ValidationError({"before": "Invalid cursor."})
            qs = qs.filter(id__lt=before_id)
        return qs

    def list(self, request, *args, **kwargs):
        require_room_access(request.user, self.get_room())
        limit_param = request.query_params.get("limit")
        try:
            limit = int(limit_param) if limit_param is not None else 20
        except ValueError:
            return Response({"detail": "Invalid limit"}, status=400)
        limit = max(1, min(limit, 100))

        qs = list(self.get_queryset()[: limit + 1])
        has_more = len(qs) > limit
        msgs = qs[:limit]
        next_cursor = msgs[-1].id if has_more else None
        serializer = self.get_serializer(msgs, many=True)
        return Response({"messages": serializer.data, "next": next_cursor})

    def create(self, request, *args, **kwargs):
        require_room_access(request.user, self.get_room())
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        identity = get_chat_identity(self.request)
        user = identity.as_user()
        room = self.get_room()
        require_room_access(user, room)
        reply_to = serializer.validated_data.get("reply_to")
        if reply_to and not room.messages.filter(pk=reply_to.pk).exists():
            raise serializers.ValidationError(
                {"reply_to": "Message does not belong to this room."}
            )
        cid = canonical_cid(None, room_uuid=room.uuid)
        message_text = serializer.validated_data.get("body") or ""
        decision = should_gate_first_message(
            cid=cid,
            user_id=identity.username,
            text=str(message_text),
            now=timezone.now(),
        )

        channel, _ = Channel.objects.get_or_create(uuid=room.uuid, client=room.client)
        with transaction.atomic():
            serializer.save(
                channel=channel,
                sent_by=identity.username,
                hidden=decision in {"hold", "reject"},
            )
            room.messages.add(serializer.instance)
        Draft.objects.filter(user=user, room=room).delete()
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.delete(f"draft:{identity.username}:{room.uuid}")
        except Exception:
            pass

        if decision == "allow":
            message_payload = MessageSerializer(serializer.instance).data
            _broadcast_to_cid(
                cid,
                {"type": "message.new", "cid": cid, "message": message_payload},
            )

            parent = getattr(serializer.instance, "reply_to", None)
            if parent:
                thread_cid = f"{cid}:thread:{parent.id}"
                _broadcast_to_cid(
                    thread_cid,
                    {"type": "message.new", "cid": thread_cid, "message": message_payload},
                )
        else:
            from stream_server_django.chat_addons.admin_console.services import gating as gating_service

            gating_service.record_intake(
                message=serializer.instance,
                cid=cid,
                user_id=identity.username,
                text=str(message_text),
                decision=decision,
                initial_broadcast=False,
                reason="spam" if decision == "reject" else None,
            )


# New Stream Chat API endpoints below


class RoomMessageDetailView(RoomFromCIDMixin, APIView):
    """Retrieve or delete a message in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MessageBurstRateThrottle, MessageSustainedRateThrottle]

    def get_throttles(self):  # type: ignore[override]
        if self.request.method.upper() not in {"PATCH", "PUT", "DELETE"}:
            return []
        return super().get_throttles()

    def _get_room(self, cid: str) -> Room:
        if ":" in cid:
            _, room_uuid = cid.split(":", 1)
        else:
            room_uuid = cid
        return get_object_or_404(Room, uuid=room_uuid)

    def _can_manage(self, user, room: Room, message: Message) -> bool:
        return can_mutate_message(user, room, message)

    def _can_delete(self, user, room: Room, message: Message) -> bool:
        return self._can_manage(user, room, message)

    def _can_update(self, user, room: Room, message: Message) -> bool:
        return self._can_manage(user, room, message)

    def _get_message(self, room: Room, message_id: str) -> Message:
        message = _message_from_identifier(message_id)
        if not room.messages.filter(pk=message.pk).exists():
            raise Http404
        return message

    def get(self, request, cid: str, message_id: str):
        room = require_room_access(request.user, self._get_room(cid))
        message = self._get_message(room, message_id)
        serializer = MessageSerializer(message)
        return Response(serializer.data)

    def patch(self, request, cid: str, message_id: str):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self._get_room(cid))
        message = self._get_message(room, message_id)

        if not self._can_update(identity.user, room, message):
            return Response(status=403)
        if {"pinned", "pinned_by"}.intersection(request.data) and not can_admin_room(
            identity.user, room
        ):
            return Response(status=403)

        update_serializer = MessageUpdateSerializer(
            message,
            data=request.data,
            partial=True,
            context={
                "request": request,
                "attachment_room": room,
                "attachment_user": identity.user,
            },
        )
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()

        response_serializer = MessageSerializer(message)
        message_payload = response_serializer.data

        cid = f"messaging:{room.uuid}"
        _broadcast_to_cid(
            cid,
            {"type": "message.updated", "cid": cid, "message": message_payload},
        )

        return Response(message_payload)

    def put(self, request, cid: str, message_id: str):
        return self.patch(request, cid, message_id)

    def delete(self, request, cid: str, message_id: str):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self._get_room(cid))
        message = self._get_message(room, message_id)

        if not self._can_delete(identity.user, room, message):
            return Response(status=403)

        deleted_at = timezone.now()
        message.deleted_at = deleted_at
        message.save(update_fields=["deleted_at"])

        cid = f"messaging:{room.uuid}"
        _broadcast_to_cid(
            cid,
            {
                "type": "message.deleted",
                "cid": cid,
                "message_id": str(message.id),
                "deleted_by": identity.id,
                "ts": deleted_at.isoformat(),
            },
        )

        return Response(status=204)


def _get_read_state_channel(room: Room) -> Channel:
    """Return the Channel row corresponding to a Room's uuid/client."""

    defaults = {"client": room.client or "stream"}
    channel, _ = Channel.objects.get_or_create(uuid=room.uuid, defaults=defaults)
    return channel


def _count_unread_messages(room: Room, state: ReadState | None) -> int:
    """Return unread messages for a room given an optional read state."""

    if state is None:
        return room.messages.count()
    return room.messages.filter(created_at__gt=state.last_read).count()


class RoomMarkReadView(RoomFromCIDMixin, APIView):
    """Mark all messages in a room as read for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self.get_room(room_uuid))
        channel = _get_read_state_channel(room)
        user_identifier = str(identity.id)
        read_state, _ = ReadState.objects.update_or_create(
            user=user_identifier,
            channel=channel,
            defaults={"last_read": timezone.now()},
        )

        # Mirror Stream's ``message.read`` event shape so other clients stay in sync.
        channel_unread_count = _count_unread_messages(room, read_state)
        now = timezone.now()
        event_payload = {
            "type": "message.read",
            "cid": canonical_cid(None, room_uuid=room.uuid),
            "user": {
                "id": read_state.user,
                "channel_last_read_at": read_state.last_read.isoformat().replace(
                    "+00:00", "Z"
                ),
                "channel_unread_count": channel_unread_count,
                "unread_count": 0,
                "unread_channels": 0,
                "total_unread_count": 0,
            },
            "created_at": now.isoformat().replace("+00:00", "Z"),
        }
        try:
            _broadcast_to_cid(event_payload["cid"], event_payload)
        except Exception:
            pass
        return Response({"status": "ok"})


class RoomMarkUnreadView(RoomFromCIDMixin, APIView):
    """Clear the read state for the current user in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self.get_room(room_uuid))
        channel = _get_read_state_channel(room)
        user_identifier = str(identity.id)
        ReadState.objects.filter(user=user_identifier, channel=channel).delete()
        return Response({"status": "ok"})


class RoomCountUnreadView(RoomFromCIDMixin, APIView):
    """Return number of unread messages for the current user in a room."""

    # NOTE: This endpoint is currently unused by the frontend shim.
    # See audit/mark-read-wire-trace.md for read/unread protocol status.
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self.get_room(room_uuid))
        channel = _get_read_state_channel(room)
        user_identifier = str(identity.id)
        state = ReadState.objects.filter(user=user_identifier, channel=channel).first()
        unread = _count_unread_messages(room, state)
        return Response({"unread": unread})


class RoomLastReadView(RoomFromCIDMixin, APIView):
    """Return the last read timestamp for the current user in a room."""

    # NOTE: This endpoint is currently unused by the frontend shim.
    # See audit/mark-read-wire-trace.md for read/unread protocol status.
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self.get_room(room_uuid))
        channel = _get_read_state_channel(room)
        user_identifier = str(identity.id)
        state = ReadState.objects.filter(user=user_identifier, channel=channel).first()
        last_read = state.last_read.isoformat() if state else None
        return Response({"last_read": last_read})


class RoomReadView(RoomFromCIDMixin, APIView):
    """Return read states for all users in the room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        identity = get_chat_identity(request)
        room = require_room_access(identity.user, self.get_room(room_uuid))
        channel = _get_read_state_channel(room)
        states = ReadState.objects.filter(channel=channel, user=str(identity.id))
        data = []
        for st in states:
            unread = _count_unread_messages(room, st)
            data.append(
                {
                    "user": st.user,
                    "last_read": st.last_read.isoformat(),
                    "unread_messages": unread,
                }
            )
        return Response(data)


class RoomDraftView(RoomFromCIDMixin, APIView):
    """Save and retrieve message drafts."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _user_has_access(self, request, room: Room) -> bool:
        return user_has_room_access(request.user, room)

    def post(self, request, room_uuid):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = self.get_room(room_uuid)
        if not self._user_has_access(request, room):
            return Response(status=403)
        text = request.data.get("text", "")
        Draft.objects.update_or_create(
            user=user,
            room=room,
            defaults={"text": text},
        )
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.set(f"draft:{identity.username}:{room.uuid}", text, ex=86400)
        except Exception:
            pass
        return Response({"status": "ok"})

    def get(self, request, room_uuid):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = self.get_room(room_uuid)
        if not self._user_has_access(request, room):
            return Response(status=403)
        cached_text = None
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            cached_text = r.get(f"draft:{identity.username}:{room.uuid}")
        except Exception:
            pass
        draft = Draft.objects.filter(user=user, room=room).first()
        drafts = []
        if draft:
            draft_data = DraftSerializer(draft).data
            if cached_text is not None:
                draft_data["text"] = cached_text
                draft_data["body"] = cached_text
            drafts.append(draft_data)
        elif cached_text is not None:
            drafts.append({"text": cached_text, "body": cached_text})
        return Response(drafts)

    def delete(self, request, room_uuid):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = self.get_room(room_uuid)
        if not self._user_has_access(request, room):
            return Response(status=403)
        Draft.objects.filter(user=user, room=room).delete()
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.delete(f"draft:{identity.username}:{room.uuid}")
        except Exception:
            pass
        return Response({"status": "ok"})


class MessageDetailView(APIView):
    """Retrieve, update or delete a single message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MessageBurstRateThrottle, MessageSustainedRateThrottle]

    def get_throttles(self):  # type: ignore[override]
        if self.request.method.upper() not in {"PUT", "DELETE"}:
            return []
        return super().get_throttles()

    def get(self, request, message_id):
        msg, _room = _message_and_room_for_user(request.user, message_id)
        serializer = MessageSerializer(msg)
        return Response(serializer.data)

    def put(self, request, message_id):
        msg, room = _message_and_room_for_user(request.user, message_id)
        if not can_mutate_message(request.user, room, msg):
            raise PermissionDenied()
        if {"pinned", "pinned_by"}.intersection(request.data) and not can_admin_room(
            request.user, room
        ):
            raise PermissionDenied()
        serializer = MessageUpdateSerializer(
            msg,
            data=request.data,
            partial=True,
            context={
                "request": request,
                "attachment_room": room,
                "attachment_user": request.user,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        payload = MessageSerializer(msg).data

        cid = canonical_cid(None, room_uuid=room.uuid)
        _broadcast_to_cid(
            cid,
            {"type": "message.updated", "cid": cid, "message": payload},
        )

        return Response(payload)

    def delete(self, request, message_id):
        identity = get_chat_identity(request)
        msg, room = _message_and_room_for_user(identity.user, message_id)
        if not can_mutate_message(identity.user, room, msg):
            raise PermissionDenied()
        msg.deleted_at = timezone.now()
        msg.save(update_fields=["deleted_at"])

        cid = canonical_cid(None, room_uuid=room.uuid)
        _broadcast_to_cid(
            cid,
            {
                "type": "message.deleted",
                "cid": cid,
                "message_id": str(msg.id),
                "deleted_by": identity.id,
                "ts": msg.deleted_at.isoformat(),
            },
        )

        return Response(MessageSerializer(msg).data)


class MessageRestoreView(APIView):
    """Restore a previously deleted message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MessageBurstRateThrottle, MessageSustainedRateThrottle]

    def get_throttles(self):  # type: ignore[override]
        if self.request.method.upper() != "POST":
            return []
        return super().get_throttles()

    def post(self, request, message_id):
        msg, room = _message_and_room_for_user(request.user, message_id)
        if not can_mutate_message(request.user, room, msg):
            raise PermissionDenied()
        msg.deleted_at = None
        msg.save(update_fields=["deleted_at"])

        payload = MessageSerializer(msg).data
        cid = canonical_cid(None, room_uuid=room.uuid)
        _broadcast_to_cid(
            cid,
            {"type": "message.updated", "cid": cid, "message": payload},
        )

        return Response(payload)


class MessageHideView(APIView):
    """Hide or unhide a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _allow_self_hide(self) -> bool:
        return bool(getattr(settings, "CHAT_ALLOW_SELF_HIDE", False))

    def _can_moderate(self, user, room: Room, message: Message) -> bool:
        identity = ChatIdentity(user)

        if can_admin_room(identity.user, room):
            return True
        if self._allow_self_hide() and user_is_message_author(identity.user, message):
            return True
        return False

    def post(self, request, message_id: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        message, room = _message_and_room_for_user(user, message_id)
        if not self._can_moderate(user, room, message):
            return Response(status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if not message.hidden:
            message.hidden = True
        message.hidden_by = user
        message.hidden_at = now
        message.save(update_fields=["hidden", "hidden_by", "hidden_at", "updated_at"])

        broadcast_message_update(message)
        payload = MessageSerializer(message).data
        return Response({"status": "hidden", "message": payload})

    def delete(self, request, message_id: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        message, room = _message_and_room_for_user(user, message_id)
        if not self._can_moderate(user, room, message):
            return Response(status=status.HTTP_403_FORBIDDEN)

        message.hidden = False
        message.hidden_by = None
        message.hidden_at = None
        message.save(update_fields=["hidden", "hidden_by", "hidden_at", "updated_at"])

        broadcast_message_update(message)
        payload = MessageSerializer(message).data
        return Response({"status": "visible", "message": payload})


class MessageReactionsView(APIView):
    """List or create reactions for a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        msg, _room = _message_and_room_for_user(request.user, message_id)
        serializer = ReactionSerializer(msg.reactions.all(), many=True)
        return Response(serializer.data)

    def post(self, request, message_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        msg, _room = _message_and_room_for_user(user, message_id)
        serializer = ReactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reaction = Reaction.objects.create(
            message=msg,
            user=user,
            type=serializer.validated_data["type"],
        )
        return Response(ReactionSerializer(reaction).data, status=201)


class MessageReactionTypeView(APIView):
    """Create or delete a reaction of a specific type for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ReactionBurstRateThrottle, ReactionSustainedRateThrottle]

    def get_throttles(self):  # type: ignore[override]
        if self.request.method.upper() not in {"POST", "DELETE"}:
            return []
        return super().get_throttles()

    def post(self, request, message_id, reaction_type):
        identity = get_chat_identity(request)
        user = identity.as_user()
        message, room = _message_and_room_for_user(user, message_id)
        reaction, created = Reaction.objects.get_or_create(
            message=message,
            user=user,
            type=reaction_type,
        )

        ts = reaction.created_at if created else timezone.now()
        cid = canonical_cid(None, room_uuid=room.uuid)

        _broadcast_to_cid(
            cid,
            {
                "type": "reaction.new",
                "event": "reaction.new",
                "event_type": "reaction.new",
                "cid": cid,
                "message_id": str(message.id),
                "user_id": identity.id,
                "reaction_type": reaction_type,
                "ts": ts.isoformat(),
            },
        )

        return Response(
            {"status": "ok", "message_id": str(message.id), "type": reaction_type},
            status=200,
        )

    def delete(self, request, message_id, reaction_type):
        identity = get_chat_identity(request)
        user = identity.as_user()
        message, room = _message_and_room_for_user(user, message_id)
        qs = Reaction.objects.filter(
            message=message,
            user=user,
            type=reaction_type,
        )
        existed = qs.exists()
        if existed:
            qs.delete()

        if existed:
            cid = canonical_cid(None, room_uuid=room.uuid)
            _broadcast_to_cid(
                cid,
                {
                    "type": "reaction.deleted",
                    "event": "reaction.deleted",
                    "event_type": "reaction.deleted",
                    "cid": cid,
                    "message_id": str(message.id),
                    "user_id": identity.id,
                    "reaction_type": reaction_type,
                    "ts": timezone.now().isoformat(),
                },
            )

        return Response(
            {"status": "ok", "message_id": str(message.id), "type": reaction_type},
            status=200,
        )


class MessageFlagView(APIView):
    """Flag a message for moderation."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        msg, _room = _message_and_room_for_user(user, message_id)
        flag, _ = Flag.objects.get_or_create(message=msg, user=user)
        return Response({"flag": FlagSerializer(flag).data}, status=201)


class MessagePinView(APIView):
    """Pin a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        msg, room = _message_and_room_for_user(user, message_id)
        if not can_admin_room(user, room):
            raise PermissionDenied()
        pin, _ = Pin.objects.get_or_create(message=msg, user=user)
        return Response({"pin": PinSerializer(pin).data}, status=201)


class MessageUnpinView(APIView):
    """Remove the current user's pin from a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, message_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        msg, room = _message_and_room_for_user(user, message_id)
        if not can_admin_room(user, room):
            raise PermissionDenied()
        Pin.objects.filter(message=msg, user=user).delete()
        return Response(status=204)


class MessageActionView(APIView):
    """Record an action on a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg, room = _message_and_room_for_user(request.user, message_id)
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        data = request.data or {}
        custom = msg.custom_data or {}
        actions = custom.get("actions", [])
        actions.append(data)
        custom["actions"] = actions
        msg.custom_data = custom
        msg.save(update_fields=["custom_data"])
        return Response({"action": data}, status=201)


class PollOptionCreateView(APIView):
    """Compatibility adapter for canonical room-bound poll options."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, poll_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        poll = _authorized_poll(user, poll_id)
        serializer = RoomPollOptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option = RoomPollOption.objects.create(
            poll=poll,
            text=serializer.validated_data["text"],
            created_by=user,
        )
        return Response({"poll_option": _legacy_poll_option_data(option)}, status=201)


class PollListCreateView(APIView):
    """Compatibility adapter over the canonical room-bound poll model."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        cid = request.query_params.get("cid")
        if cid:
            room = _authorized_room(user, cid)
            polls = RoomPoll.objects.filter(room=room)
        else:
            rooms = rooms_accessible_to_user(user)
            polls = RoomPoll.objects.filter(room__in=rooms, room__isnull=False)
        polls = polls.select_related("created_by", "room").order_by(
            "-created_at", "-id"
        )
        if not polls.exists():
            return Response(status=405)
        return Response([_legacy_poll_data(poll) for poll in polls])

    def post(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        serializer = RoomPollCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room = _authorized_room(user, serializer.validated_data["cid"])
        with transaction.atomic():
            poll = RoomPoll.objects.create(
                room=room,
                cid=room.cid,
                question=serializer.validated_data["question"],
                created_by=user,
            )
            for text in serializer.validated_data["options"]:
                RoomPollOption.objects.create(poll=poll, text=text, created_by=user)
        return Response({"poll": _legacy_poll_data(poll)}, status=201)


class PollDetailView(APIView):
    """Delete a canonical poll through the legacy response contract."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, poll_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        poll = _authorized_poll(user, poll_id)
        if not _can_delete_poll(user, poll):
            raise PermissionDenied()
        poll.delete()
        return Response(status=204)


class PollOptionVotesListView(APIView):
    """Return room-authorized canonical votes in the legacy shape."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, poll_id, option_id):
        identity = get_chat_identity(request)
        user = identity.as_user()
        poll = _authorized_poll(user, poll_id)
        option = get_object_or_404(RoomPollOption, id=option_id, poll=poll)

        try:
            limit_param = request.query_params.get("limit")
            limit = int(limit_param) if limit_param is not None else 25
        except (TypeError, ValueError):
            return Response({"detail": "Invalid limit"}, status=400)

        limit = max(1, min(limit, 100))
        cursor = request.query_params.get("cursor")

        votes_qs = RoomPollVote.objects.filter(poll=poll, option=option).order_by(
            "-created_at", "-id"
        )

        if cursor:
            try:
                cursor_vote = RoomPollVote.objects.get(
                    id=cursor, poll=poll, option=option
                )
            except (RoomPollVote.DoesNotExist, DjangoValidationError, ValueError):
                return Response({"detail": "Invalid cursor"}, status=400)

            votes_qs = votes_qs.filter(
                Q(created_at__lt=cursor_vote.created_at)
                | (
                    Q(created_at=cursor_vote.created_at)
                    & Q(id__lt=cursor_vote.id)
                )
            )

        total = RoomPollVote.objects.filter(poll=poll, option=option).count()
        paginated = list(votes_qs[: limit + 1])
        has_next = len(paginated) > limit
        votes = paginated[:limit]

        next_cursor = None
        if has_next and votes:
            next_cursor = str(votes[-1].id)

        response_data = {
            "results": [_legacy_poll_vote_data(vote) for vote in votes],
            "count": total,
        }
        if next_cursor:
            response_data["next"] = next_cursor
        if cursor:
            response_data["prev"] = cursor

        return Response(response_data)


def _legacy_poll_data(poll: RoomPoll) -> dict:
    return {
        "id": str(poll.id),
        "question": poll.question,
        "user_id": poll.created_by.get_username(),
        "created_at": poll.created_at,
    }


def _legacy_poll_option_data(option: RoomPollOption) -> dict:
    return {
        "id": str(option.id),
        "poll_id": str(option.poll_id),
        "text": option.text,
        "user_id": option.created_by.get_username(),
        "created_at": option.created_at,
    }


def _legacy_poll_vote_data(vote: RoomPollVote) -> dict:
    user = vote.user
    profile = getattr(user, "profile", None)
    return {
        "id": str(vote.id),
        "poll_id": str(vote.poll_id),
        "option_id": str(vote.option_id),
        "user_id": user.get_username(),
        "user": {
            "id": str(getattr(user, "supabase_uid", None) or user.id),
            "name": getattr(profile, "display_name", None) or user.get_username(),
            "image": getattr(profile, "image_url", None),
        },
        "created_at": vote.created_at,
        "updated_at": vote.updated_at,
    }


class RoomConfigView(RoomFromCIDMixin, APIView):
    """Return basic metadata for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, cid: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        try:
            room_type, room_uuid = cid.split(":", 1)
        except ValueError:
            return Response({"detail": "Invalid cid"}, status=400)

        room = self.get_room(room_uuid)
        require_room_access(user, room)

        name = room.data.get("name") if room.data else None
        muted = RoomMute.objects.filter(user=user, room=room).exists()

        return Response({"name": name, "type": room_type, "muted": muted})


class RoomMuteStatusView(RoomFromCIDMixin, APIView):
    """Return mute status for the current user in the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, cid: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = require_room_access(user, self.get_room(cid))
        mute = RoomMute.objects.filter(user=user, room=room).first()
        muted_until = getattr(mute, "muted_until", None)
        serializer = MuteStatusSerializer(
            {"muted": mute is not None, "muted_until": muted_until}
        )
        return Response(serializer.data)


class RoomMemberMuteCreateView(RoomFromCIDMixin, APIView):
    """Mute a room member via POST."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _can_mute(self, acting_user, room: Room, target_user) -> bool:
        acting_identity = ChatIdentity(acting_user)

        if acting_identity.id == getattr(target_user, "id", None):
            return True
        if room.agent_id and room.agent_id == acting_identity.id:
            return True
        if acting_identity.is_staff or acting_identity.is_superuser:
            return True
        return False

    def post(self, request, cid: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = require_room_access(user, self.get_room(cid))
        serializer = RoomMemberMuteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["user"]
        muted_until = serializer.validated_data.get("muted_until")

        if not self._can_mute(user, room, target_user):
            return Response(status=403)
        if not user_is_room_participant(target_user, room):
            return Response(status=403)

        mute, _created = RoomMemberMute.objects.update_or_create(
            room=room,
            user=target_user,
            defaults={"muted_by": user, "muted_until": muted_until},
        )

        response_data = RoomMemberMuteSerializer(mute).data

        canonical = canonical_cid(cid, room_uuid=room.uuid)
        payload = {
            "type": "member.muted",
            "cid": canonical,
            "target_user": target_user.id,
            "user_id": target_user.id,
            "muted": True,
            "muted_until": mute.muted_until.isoformat() if mute.muted_until else None,
            "muted_by": identity.id,
            "ts": timezone.now().isoformat(),
        }
        _broadcast_to_cid(canonical, payload)

        return Response(response_data, status=201)


class RoomConfigStateView(RoomFromCIDMixin, APIView):
    """Return message composer configuration for the room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
        if not user_has_room_access(request.user, room):
            if not (
                is_public_agent_room(room)
                and is_at_least_guest_identity(request)
            ):
                raise PermissionDenied()
        canonical = canonical_cid(room_uuid, room_uuid=room.uuid)
        composer = {
            "attachments": {"acceptedFiles": [], "maxNumberOfFilesPerMessage": 10},
            "text": {"enabled": True},
            "multipleUploads": True,
            "isUploadEnabled": True,
        }
        ai_config = _ai_config_payload(canonical, room)
        return Response(
            {
                "config": {
                    "composer": composer,
                    "ai": ai_config,
                },
                "has_ai_assistant": bool(ai_config.get("enabled")) if ai_config else False,
                "ai_assistant": _ai_assistant_payload(ai_config),
            }
        )


def _ai_config_payload(canonical: str, room: Room) -> dict:
    room_data = room.data if isinstance(room.data, dict) else {}
    enabled = bool(agent_enabled_for_room(canonical, room)) if agent_enabled_for_room else False
    bot_user_id = (
        agent_user_id_for_room(canonical)
        if agent_user_id_for_room
        else f"room:{room.uuid}:bot"
    )
    persona_summary = None
    summary = None
    if isinstance(room_data, dict):
        summary = room_data.get("personaSummary") or room_data.get("persona_summary")
    if isinstance(summary, str):
        persona_summary = summary

    return {
        "enabled": enabled,
        "botUserId": bot_user_id,
        "displayName": "Assistant",
        "personaSummary": persona_summary,
    }


def _ai_assistant_payload(ai_config: dict | None) -> dict | None:
    if not ai_config:
        return None

    bot_user_id = ai_config.get("botUserId") or ai_config.get("user_id")
    if not bot_user_id:
        return None

    return {
        "user_id": bot_user_id,
        "display_name": ai_config.get("displayName") or "Assistant",
        "persona_summary": ai_config.get("personaSummary"),
    }


class RoomArchiveView(RoomFromCIDMixin, APIView):
    """Archive a room by setting its status to CLOSED."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        room.status = Room.CLOSED
        room.save()
        return Response({"status": "ok"})


class RoomUnarchiveView(RoomFromCIDMixin, APIView):
    """Reopen a previously archived room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        room.status = Room.ACTIVE
        room.save()
        return Response({"status": "ok"})


class RoomCooldownView(RoomFromCIDMixin, APIView):
    """Return cooldown seconds for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        require_room_access(request.user, self.get_room(room_uuid))
        return Response({"cooldown": 0})


class RoomMembersView(RoomFromCIDMixin, APIView):
    """Return list of members for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        names = set(room.messages.values_list("sent_by", flat=True))
        if room.client:
            names.add(room.client)
        if room.agent:
            names.add(room.agent.username)
        return Response([{"id": name} for name in sorted(names)])


class RoomMembersCIDView(RoomFromCIDMixin, APIView):
    """Return paginated members for the room identified by cid."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, cid: str):
        try:
            _, room_uuid = cid.split(":", 1)
        except ValueError:
            return Response({"detail": "Invalid cid"}, status=400)

        room = require_room_access(request.user, self.get_room(room_uuid))

        limit_param = request.query_params.get("limit")
        offset_param = request.query_params.get("offset")
        try:
            limit = int(limit_param) if limit_param is not None else 20
            offset = int(offset_param) if offset_param is not None else 0
        except ValueError:
            return Response({"detail": "Invalid pagination"}, status=400)

        limit = max(1, min(limit, 100))
        offset = max(0, offset)

        names = set(room.messages.values_list("sent_by", flat=True))
        if room.client:
            names.add(room.client)
        if room.agent:
            names.add(room.agent.username)

        sorted_names = sorted(names)
        page = sorted_names[offset : offset + limit]
        data = [{"id": n, "role": "member", "banned": False} for n in page]
        return Response(data)


class RoomPinnedMessagesView(RoomFromCIDMixin, APIView):
    """Return messages pinned in the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        msgs = room.messages.filter(pins__isnull=False).distinct()
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class RoomQueryView(RoomFromCIDMixin, APIView):
    """Return initial messages and members for a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        messages = MessageSerializer(room.messages.all(), many=True).data
        names = set(room.messages.values_list("sent_by", flat=True))
        if room.agent:
            names.add(room.agent.username)
        members = [{"id": name} for name in sorted(names)]
        return Response({"messages": messages, "members": members})


class ActiveRoomListView(generics.ListAPIView):
    """Return all rooms currently marked as ACTIVE."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoomSerializer

    def get_queryset(self):
        return rooms_accessible_to_user(
            self.request.user, Room.objects.filter(status=Room.ACTIVE)
        )


class NotificationListView(APIView):
    """Return notifications for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        notes = Notification.objects.filter(user=user)
        serializer = NotificationSerializer(notes, many=True)
        return Response(serializer.data)


class ReminderListCreateView(RoomFromCIDMixin, APIView):
    """List or create reminders for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        reminders = Reminder.objects.filter(created_by=user)
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    def post(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        cid = request.data.get("cid")
        if not cid:
            return Response({"cid": ["This field is required."]}, status=400)
        if not isinstance(cid, str):
            return Response({"cid": ["A valid string is required."]}, status=400)
        cid_value = cid.strip()
        if not cid_value:
            return Response({"cid": ["This field may not be blank."]}, status=400)

        room = self.get_room(cid_value)
        if not _user_can_access_room(user, room):
            return Response(status=403)

        payload = request.data.copy()
        if hasattr(payload, "pop"):
            payload.pop("cid", None)
        else:
            payload = {k: v for k, v in payload.items() if k != "cid"}

        serializer = ReminderCreateSerializer(data=payload, context={"room": room, "user": user})
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        reminder_data = ReminderSerializer(reminder).data

        _broadcast_reminder_created(room, cid_value, reminder_data)

        return Response(reminder_data, status=201)


class ReminderDetailView(APIView):
    """Retrieve or delete a specific reminder."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, reminder_id: int):
        identity = get_chat_identity(request)
        try:
            reminder = Reminder.objects.get(id=reminder_id)
        except Reminder.DoesNotExist:
            return Response(status=404)

        if reminder.created_by_id != identity.id:
            return Response(status=403)

        reminder.delete()
        return Response(status=204)


class RoomReminderCreateView(RoomFromCIDMixin, APIView):
    """Create a reminder scoped to a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, cid: str):
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = self.get_room(cid)
        if not _user_can_access_room(user, room):
            return Response(status=403)
        serializer = ReminderCreateSerializer(
            data=request.data, context={"room": room, "user": user}
        )
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        reminder_data = ReminderSerializer(reminder).data

        _broadcast_reminder_created(room, cid, reminder_data)

        return Response(reminder_data, status=201)


class MutedChannelListView(APIView):
    """Return channels muted by the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        accessible_room_ids = rooms_accessible_to_user(user).values_list(
            "id", flat=True
        )
        mutes = RoomMute.objects.filter(
            user=user, room_id__in=accessible_room_ids
        )
        rooms = [m.room for m in mutes]
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class MuteStatusView(APIView):
    """Return whether the current user muted the given user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, target_username):
        identity = get_chat_identity(request)
        user = identity.as_user()
        target = get_object_or_404(get_user_model(), username=target_username)
        muted = UserMute.objects.filter(user=user, target=target).exists()
        return Response({"muted": muted})


class MutedUsersView(APIView):
    """Return list of users muted by the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        qs = UserMute.objects.filter(user=user).select_related("target")
        data = [{"id": m.target.id, "username": m.target.username} for m in qs]
        return Response(data)


class MuteUserView(APIView):
    """Mute the given user for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, target_username):
        identity = get_chat_identity(request)
        user = identity.as_user()
        target = get_object_or_404(get_user_model(), username=target_username)
        UserMute.objects.get_or_create(user=user, target=target)
        return Response({"status": "ok"})


class UnmuteUserView(APIView):
    """Remove a global mute for the given target user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserMuteUnmuteSerializer

    def post(self, request):
        identity = get_chat_identity(request)
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request, "identity": identity},
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return Response(payload, status=status.HTTP_200_OK)


_service_account_cache = None
_service_account_cache_key = None


def _get_service_account():
    global _service_account_cache, _service_account_cache_key
    raw = getattr(settings, "CHAT_ATTACHMENTS_SERVICE_ACCOUNT_INFO", None)
    signing_email = str(
        getattr(settings, "CHAT_ATTACHMENTS_SIGNING_SERVICE_ACCOUNT", "")
    ).strip()
    if not raw and not signing_email:
        return None
    cache_key = raw or f"iam:{signing_email}"
    if isinstance(raw, dict):
        cache_key = json.dumps(raw, sort_keys=True)
    if _service_account_cache and _service_account_cache_key == cache_key:
        return _service_account_cache
    try:
        account = (
            load_service_account(raw)
            if raw
            else load_iam_signing_identity(signing_email)
        )
    except Exception:
        logger.exception("Invalid service account configuration")
        return None
    _service_account_cache = account
    _service_account_cache_key = cache_key
    return account


def _direct_uploads_enabled() -> bool:
    return bool(
        getattr(settings, "CHAT_ATTACHMENTS_PENDING_BUCKET", None)
        and getattr(settings, "CHAT_ATTACHMENTS_CLEAN_BUCKET", None)
        and getattr(settings, "CHAT_ATTACHMENTS_QUARANTINE_BUCKET", None)
        and getattr(settings, "CHAT_ATTACHMENTS_SCANNER_BACKEND", None)
        and _get_service_account()
    )


def _attachment_allowed_types() -> list[str]:
    raw = getattr(settings, "CHAT_ATTACHMENTS_ALLOWED_TYPES", None)
    if raw is None:
        return []
    if isinstance(raw, (list, tuple)):
        return [str(item) for item in raw]
    return [part.strip() for part in str(raw).split(",") if part.strip()]


def _attachment_max_size() -> int:
    default = 25 * 1024 * 1024
    try:
        return int(getattr(settings, "CHAT_ATTACHMENTS_MAX_SIZE", default))
    except (TypeError, ValueError):
        return default


def _identity_message_author(identity: ChatIdentity, message: Message) -> bool:
    identifiers = {
        str(value)
        for value in (identity.id, identity.username, identity.supabase_uid)
        if value not in (None, "")
    }
    return str(message.sent_by) in identifiers


def _can_attach_to_message(identity: ChatIdentity, message: Message, room: Room) -> bool:
    return bool(
        _identity_message_author(identity, message)
        or identity.is_staff
        or identity.is_superuser
        or room.agent_id == identity.id
    )


def _resolve_attachment_binding(
    *,
    user,
    cid: str | None,
    message_id: str | None,
    require_message_mutation: bool = False,
) -> tuple[Room, Message | None, str]:
    """Resolve and authorize the server-side room/message upload binding.

    A room is always required.  A message may be omitted for the normal
    upload-before-send flow, but a later commit may only bind that upload to a
    message in the already-authorized room.
    """

    identity = ChatIdentity(user)
    room = None
    message = None

    if cid:
        room = get_room_or_404(cid)

    if message_id:
        message = _message_from_identifier(message_id)
        if room is not None:
            if not room.messages.filter(pk=message.pk).exists():
                raise serializers.ValidationError({"message_id": "message not in room"})
        else:
            room = next(
                (
                    candidate
                    for candidate in message.rooms.all()
                    if user_has_room_access(user, candidate)
                ),
                None,
            )

    if room is None:
        raise serializers.ValidationError({"cid": "cid or message_id required"})

    if not user_has_room_access(user, room):
        raise PermissionDenied()

    if message is not None and require_message_mutation:
        if not _can_attach_to_message(identity, message, room):
            raise PermissionDenied()

    return room, message, canonical_cid(None, room_uuid=room.uuid)


def _find_authorized_attachment(
    user, attachment_id: str
) -> tuple[Message, Room, dict]:
    """Find attachment metadata only through a room visible to ``user``.

    The attachment metadata currently lives inside ``Message.attachments``.
    Scoping the lookup to an authorized parent before returning anything keeps
    missing and inaccessible attachment identifiers indistinguishable (404).
    """

    messages = Message.objects.exclude(attachments=[]).prefetch_related("rooms")
    for message in messages.iterator(chunk_size=100):
        attachment = message.get_attachment(attachment_id)
        if attachment is None:
            continue
        for room in message.rooms.all():
            if not user_has_room_access(user, room):
                continue
            if not attachment_integrity_is_valid(
                attachment,
                message=message,
                room=room,
                allow_unbound=False,
            ):
                continue
            return message, room, attachment
    raise Http404


class SignAttachmentView(APIView):
    """Return a signed URL for uploading an attachment to GCS."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField()
        content_type = serializers.CharField()
        size = serializers.IntegerField(min_value=1)
        cid = serializers.CharField(required=False, allow_blank=True)
        message_id = serializers.CharField(required=False, allow_blank=True)

    def post(self, request):
        require_permanent_supabase_user(request)
        identity = get_chat_identity(request)
        if not _direct_uploads_enabled():
            return Response(
                {"detail": "Direct uploads are disabled"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        name = safe_filename(str(validated["name"]).strip())
        if not name:
            return Response({"detail": "name required"}, status=400)

        room, message, canonical = _resolve_attachment_binding(
            user=request.user,
            cid=validated.get("cid") or None,
            message_id=validated.get("message_id") or None,
            require_message_mutation=True,
        )

        allowed_types = _attachment_allowed_types()
        content_type = str(validated["content_type"]).strip()
        if not allowed_types or content_type not in allowed_types:
            return Response({"detail": "unsupported content_type"}, status=400)

        size = int(validated["size"])
        max_size = _attachment_max_size()
        if size > max_size:
            return Response({"detail": "size exceeds limit"}, status=400)

        attachment_id = f"att_{uuid.uuid4().hex}"
        blob_name = blob_name_for(attachment_id, name)
        upload_id = f"upl_{uuid.uuid4().hex}"

        account = _get_service_account()
        if not account:
            return Response({"detail": "Direct uploads misconfigured"}, status=503)

        expires = getattr(settings, "CHAT_ATTACHMENTS_SIGN_TTL_SECONDS", 600)
        try:
            ttl_seconds = max(300, int(expires))
        except (TypeError, ValueError):
            ttl_seconds = 600

        try:
            signed_url = generate_signed_url(
                service_account=account,
                method="PUT",
                bucket=settings.CHAT_ATTACHMENTS_PENDING_BUCKET,
                blob_name=blob_name,
                content_type=content_type,
                expires=timedelta(seconds=ttl_seconds),
            )
        except Exception:
            logger.exception("Failed to sign GCS upload URL")
            return Response({"detail": "failed to sign upload"}, status=503)

        session_data = {
            "attachment_id": attachment_id,
            "created_at": timezone.now().isoformat(),
            "name": name,
            "content_type": content_type,
            "size": size,
            "blob_name": blob_name,
            "user_id": identity.id,
            "cid": canonical,
            "room_uuid": room.uuid,
            "message_id": str(message.id) if message is not None else None,
            "storage_bucket": settings.CHAT_ATTACHMENTS_PENDING_BUCKET,
        }
        _store_upload_session(upload_id, session_data)

        return Response(
            {
                "upload_id": upload_id,
                "method": "PUT",
                "url": signed_url,
                "headers": {"Content-Type": content_type},
                "constraints": {
                    "maxSize": max_size,
                    "allowedTypes": allowed_types,
                },
                "blob_name": blob_name,
                "attachment_id": attachment_id,
            }
        )


class CommitAttachmentView(APIView):
    """Verify an uploaded attachment and optionally attach to a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        upload_id = serializers.CharField()
        blob_name = serializers.CharField()
        sha256 = serializers.CharField()
        size = serializers.IntegerField(min_value=1)
        cid = serializers.CharField(required=False, allow_blank=True)
        message_id = serializers.CharField(required=False, allow_blank=True)

    def post(self, request):
        require_permanent_supabase_user(request)
        identity = get_chat_identity(request)
        if not _direct_uploads_enabled():
            return Response(
                {"detail": "Direct uploads are disabled"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        upload_id = validated["upload_id"]
        session = _load_upload_session(upload_id)
        if not session:
            return Response({"detail": "upload expired"}, status=400)

        if str(session.get("user_id")) != str(identity.id):
            return Response(status=403)

        blob_name = validated["blob_name"]
        if blob_name != session.get("blob_name"):
            _delete_upload_session(upload_id)
            return Response({"detail": "blob mismatch"}, status=400)

        expected_size = int(session.get("size") or 0)
        provided_size = int(validated["size"])
        if expected_size != provided_size:
            _delete_upload_session(upload_id)
            return Response({"detail": "size mismatch"}, status=400)

        checksum = str(validated["sha256"]).strip().lower()

        requested_cid = validated.get("cid") or None
        if requested_cid:
            requested_cid = canonical_cid(requested_cid)
            if requested_cid != session.get("cid"):
                _delete_upload_session(upload_id)
                return Response({"detail": "cid mismatch"}, status=400)

        requested_message_id = validated.get("message_id") or None
        if requested_message_id:
            requested_message_id = str(requested_message_id)
        session_message_id = session.get("message_id") or None
        if session_message_id:
            session_message_id = str(session_message_id)
        if session_message_id and requested_message_id:
            if session_message_id != requested_message_id:
                _delete_upload_session(upload_id)
                return Response({"detail": "message mismatch"}, status=400)

        message_id = session_message_id or requested_message_id
        try:
            room, message, canonical = _resolve_attachment_binding(
                user=request.user,
                cid=session.get("cid"),
                message_id=message_id,
                require_message_mutation=bool(message_id),
            )
        except (Http404, PermissionDenied, serializers.ValidationError):
            _delete_upload_session(upload_id)
            raise

        if str(room.uuid) != str(session.get("room_uuid")):
            _delete_upload_session(upload_id)
            return Response({"detail": "room mismatch"}, status=400)

        committed_attachment = session.get("committed_attachment")
        if committed_attachment:
            if checksum != str(committed_attachment.get("sha256", "")).lower():
                return Response({"detail": "checksum mismatch"}, status=400)
            if message is not None:
                committed_attachment = (
                    message.get_attachment(session["attachment_id"])
                    or committed_attachment
                )
            return Response({"attachment": committed_attachment}, status=200)

        account = _get_service_account()
        if not account:
            _delete_upload_session(upload_id)
            return Response({"detail": "Direct uploads misconfigured"}, status=503)

        try:
            verify_url = generate_signed_url(
                service_account=account,
                method="GET",
                bucket=settings.CHAT_ATTACHMENTS_PENDING_BUCKET,
                blob_name=blob_name,
                expires=timedelta(seconds=120),
            )
            actual_checksum, actual_size = download_blob(verify_url)
        except Exception:
            _delete_upload_session(upload_id)
            logger.exception("Failed to verify uploaded attachment")
            return Response({"detail": "verification failed"}, status=503)

        if actual_size != expected_size:
            _delete_upload_session(upload_id)
            return Response({"detail": "size mismatch"}, status=400)

        if actual_checksum.lower() != checksum:
            _delete_upload_session(upload_id)
            return Response({"detail": "checksum mismatch"}, status=400)

        attachment_payload = {
            "id": session["attachment_id"],
            "name": session["name"],
            "filename": session["name"],
            "url": _attachment_download_url(
                request, session["attachment_id"], blob_name
            ),
            "blob": blob_name,
            "content_type": session["content_type"],
            "mime_type": session["content_type"],
            "size": expected_size,
            "sha256": checksum,
            "uploaded_by": str(identity.id),
            "message_id": str(message.id) if message is not None else None,
            "cid": canonical,
            "room_uuid": str(room.uuid),
            "storage_bucket": settings.CHAT_ATTACHMENTS_PENDING_BUCKET,
            "storage_class": "pending",
            "object_generation": None,
        }
        attachment_payload = Message.ensure_attachment_scan_defaults(attachment_payload)
        attachment_payload["integrity"] = _sign_attachment_metadata(
            attachment_payload
        )

        if message is not None:
            attachment_added = False
            with transaction.atomic():
                message = Message.objects.select_for_update().get(pk=message.pk)
                attachments = list(message.attachments or [])
                attachment_exists = any(
                    item.get("id") == attachment_payload["id"]
                    for item in attachments
                )
                if not attachment_exists:
                    attachments.append(attachment_payload)
                    message.attachments = attachments
                    message.save(update_fields=["attachments", "updated_at"])
                    attachment_added = True

            if attachment_added:
                try:
                    scan_attachment.delay(message.id, attachment_payload["id"])
                except Exception:
                    logger.exception("Failed to enqueue attachment scan")

                payload = MessageSerializer(message).data
                _broadcast_to_cid(
                    canonical,
                    {"type": "message.updated", "cid": canonical, "message": payload},
                )

        session["message_id"] = str(message.id) if message is not None else None
        session["committed_at"] = timezone.now().isoformat()
        session["committed_attachment"] = attachment_payload
        _store_upload_session(upload_id, session)

        return Response({"attachment": attachment_payload}, status=201)


class AttachmentDownloadView(APIView):
    """Authorize an attachment through its parent room, then redirect to GCS."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, attachment_id: str):
        _message, _room, attachment = _find_authorized_attachment(
            request.user, attachment_id
        )

        scan_status = attachment.get("scan_status") or Message.ATTACHMENT_SCAN_PENDING
        if scan_status == Message.ATTACHMENT_SCAN_PENDING:
            return Response(
                {"detail": "attachment scan pending"},
                status=status.HTTP_423_LOCKED,
            )
        if scan_status == Message.ATTACHMENT_SCAN_FLAGGED:
            return Response(
                {"detail": "attachment blocked"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if scan_status == Message.ATTACHMENT_SCAN_ERROR:
            return Response(
                {"detail": "attachment scan unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if scan_status != Message.ATTACHMENT_SCAN_CLEAN:
            return Response(
                {"detail": "attachment scan pending"},
                status=status.HTTP_423_LOCKED,
            )

        blob_name = attachment.get("blob")
        object_generation = str(attachment.get("object_generation") or "").strip()
        account = _get_service_account()
        bucket = attachment.get("storage_bucket")
        clean_bucket = getattr(settings, "CHAT_ATTACHMENTS_CLEAN_BUCKET", None)
        if (
            not blob_name
            or not object_generation
            or not account
            or not bucket
            or bucket != clean_bucket
            or attachment.get("storage_class") != "clean"
        ):
            return Response(
                {"detail": "attachment unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            expires = int(
                getattr(settings, "CHAT_ATTACHMENTS_DOWNLOAD_TTL_SECONDS", 120)
            )
        except (TypeError, ValueError):
            expires = 120
        expires = min(900, max(30, expires))

        filename = safe_filename(
            str(attachment.get("filename") or attachment.get("name") or "file")
        )
        try:
            signed_url = generate_signed_url(
                service_account=account,
                method="GET",
                bucket=bucket,
                blob_name=str(blob_name),
                expires=timedelta(seconds=expires),
                extra_query={
                    "generation": object_generation,
                    "response-content-disposition": f'attachment; filename="{filename}"'
                },
            )
        except Exception:
            logger.exception("Failed to sign attachment download URL")
            return Response(
                {"detail": "attachment unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        response = HttpResponseRedirect(signed_url)
        response["Cache-Control"] = "private, no-store"
        response["Pragma"] = "no-cache"
        return response


class AttachmentUploadView(APIView):
    """Create legacy metadata without exposing a public download URL.

    This compatibility endpoint does not persist a blob.  Direct uploads use
    the sign/commit flow; consequently this URL remains unavailable until the
    metadata is attached to a message with a verified ``blob`` value.
    """

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        require_permanent_supabase_user(request)
        name = request.data.get("name")
        if not name or not str(name).strip():
            return Response({"error": "name required"}, status=status.HTTP_400_BAD_REQUEST)

        identity = get_chat_identity(request)
        clean_name = safe_filename(str(name).strip())
        attachment_id = f"att_{uuid.uuid4().hex}"
        attachment_url = _private_attachment_url(request, attachment_id)

        attachment_payload = Message.ensure_attachment_scan_defaults(
            {
                "id": attachment_id,
                "name": clean_name,
                "filename": clean_name,
                "url": attachment_url,
                "uploaded_by": str(identity.id),
                "legacy_placeholder": True,
            }
        )

        return Response(
            {"attachment": attachment_payload},
            status=status.HTTP_201_CREATED,
        )


class LinkPreviewView(APIView):
    """Return basic metadata for a URL."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get("url")
        if not url or not str(url).strip():
            return self._invalid_url_response(request, url, "url required")

        validator = URLValidator()
        try:
            validator(url)
        except DjangoValidationError:
            return self._invalid_url_response(request, url, "invalid url")

        parsed = urlparse(url)
        title = parsed.netloc or url
        return Response({"url": url, "title": title})

    def _invalid_url_response(self, request, raw_url, message):
        request_id = getattr(request, "request_id", None)
        if not request_id:
            request_id = request.headers.get("X-Request-ID") or request.META.get(
                "HTTP_X_REQUEST_ID"
            )
        raw_text = str(raw_url or "")
        parsed = urlparse(raw_text)
        fingerprint = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()[:12]
        logger.warning(
            "Link preview validation error: %s "
            "(request_id=%s, scheme=%s, hostname=%s, url_length=%s, url_fingerprint=%s)",
            message,
            request_id,
            parsed.scheme,
            parsed.hostname,
            len(raw_text),
            fingerprint,
        )

        status_code = status.HTTP_400_BAD_REQUEST
        if self._is_frontend_alias(request):
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

        return Response({"error": message}, status=status_code)

    def _is_frontend_alias(self, request):
        path = request.path or ""
        normalized = path.rstrip("/")
        return normalized == "/link-preview" and not path.startswith("/api/")


class RoomHideView(RoomFromCIDMixin, APIView):
    """Mark a room as hidden for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        data = room.data or {}
        data["hidden"] = True
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RoomShowView(RoomFromCIDMixin, APIView):
    """Unhide a room previously hidden."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        data = room.data or {}
        data["hidden"] = False
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RoomTruncateView(RoomFromCIDMixin, APIView):
    """Remove all messages from a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = require_room_access(request.user, self.get_room(room_uuid))
        if not can_admin_room(request.user, room):
            raise PermissionDenied()
        room.messages.clear()
        data = room.data or {}
        data["truncated"] = True
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RecoverStateView(APIView):
    """Return basic state for reconnect recovery."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()
        rooms = rooms_accessible_to_user(
            identity.user, Room.objects.filter(status=Room.ACTIVE)
        )
        room_data = RoomSerializer(rooms, many=True).data
        notes = Notification.objects.filter(user=user)
        note_data = NotificationSerializer(notes, many=True).data
        return Response({"stream_server_django.rooms": room_data, "notifications": note_data})


class SubarrayView(APIView):
    """Return a slice of the given array."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    MAX_ARRAY_LENGTH = 10000

    class InputSerializer(serializers.Serializer):
        array = serializers.ListField(
            child=serializers.JSONField(), allow_empty=True
        )
        start = serializers.IntegerField()
        end = serializers.IntegerField(required=False, allow_null=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)

        if not serializer.is_valid():
            detail = self._format_error(serializer.errors)
            self._log_event(
                "validation_failed",
                request,
                detail=detail,
            )
            return Response(
                {"detail": detail}, status=status.HTTP_400_BAD_REQUEST
            )

        array = serializer.validated_data["array"]
        start = serializer.validated_data["start"]
        end = serializer.validated_data.get("end")

        payload_length = len(array)
        if payload_length > self.MAX_ARRAY_LENGTH:
            detail = f"array may not contain more than {self.MAX_ARRAY_LENGTH} items"
            self._log_event(
                "payload_too_large",
                request,
                detail=detail,
                payload_length=payload_length,
            )
            return Response(
                {"detail": detail},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        normalized_start = start
        if start < 0:
            normalized_start = max(0, payload_length + start)

        normalized_end = end
        if end is None:
            normalized_end = payload_length

        result = array[normalized_start:normalized_end]

        self._log_event(
            "success",
            request,
            payload_length=payload_length,
            result_length=len(result),
        )
        return Response({"result": result})

    def _format_error(self, errors):
        if isinstance(errors, dict):
            parts = []
            for key, value in errors.items():
                value_str = self._format_error(value)
                parts.append(f"{key}: {value_str}")
            return "; ".join(parts)
        if isinstance(errors, (list, tuple)) and errors:
            return self._format_error(errors[0])
        return str(errors)

    def _request_id(self, request):
        return (
            getattr(request, "request_id", None)
            or request.headers.get("X-Request-ID")
            or request.META.get("HTTP_X_REQUEST_ID")
        )

    def _log_event(self, event, request, **extra):
        request_id = self._request_id(request)
        extra_bits = " ".join(f"{key}={value}" for key, value in extra.items())
        message = f"subarray.{event} request_id={request_id}"
        if extra_bits:
            message = f"{message} {extra_bits}"
        log_func = logger.info if event == "success" else logger.warning
        log_func(message)


class TextComposerView(APIView):
    """Echo back posted text for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")
        return Response({"text": text})


class ComposeView(APIView):
    """Echo back posted composition for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"composition": request.data})


class CompositionIsEmptyView(APIView):
    """Return whether posted text is empty after trimming."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")
        is_empty = str(text).strip() == ""
        return Response({"is_empty": is_empty})


class HasSendableDataView(APIView):
    """Return whether posted composition includes sendable data."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")
        attachments = request.data.get("attachments", [])
        poll = request.data.get("poll")
        custom = request.data.get("custom_data", {}) or {}
        if hasattr(request.data, "getlist") and request.data.getlist("attachments"):
            attachments = request.data.getlist("attachments")
        has_data = (
            str(text).strip() != ""
            or len(attachments) > 0
            or bool(poll)
            or (isinstance(custom, dict) and len(custom.keys()) > 0)
        )
        return Response({"has_sendable_data": has_data})


class InitStateView(APIView):
    """Return default composer state for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "text": "",
                "attachments": [],
                "poll": None,
                "custom_data": {},
                "quoted_message": None,
            }
        )


class StateView(APIView):
    """Return a minimal state object for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"stream_server_django.users": []})


class DispatchEventView(APIView):
    """Echo back posted event for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"event": request.data})


class EditingAuditStateView(APIView):
    """Echo back posted editing audit state for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        draft_update = request.data.get("draft_update")
        state_update = request.data.get("state_update")
        return Response({"draft_update": draft_update, "state_update": state_update})


class AxiosTestView(APIView):
    """Simple endpoint used by axiosInstance tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"method": "GET"})

    def post(self, request):
        return Response({"method": "POST", "data": request.data})

    def delete(self, request):
        return Response({"method": "DELETE"})


class WsAuthView(APIView):
    """Simple handshake endpoint for websocket connections."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"status": "ok"})


class ConnectionIDView(APIView):
    """Return a stable connection identifier for the session."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        cid = request.session.get("connection_id")
        if not cid:
            from .utils import generate_snowflake

            cid = str(generate_snowflake())
            request.session["connection_id"] = cid

        try:
            import redis
            from django.conf import settings

            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.set(f"cid:{cid}", identity.username, ex=60)
        except Exception:
            pass

        return Response({"connection_id": cid})


class ContextTypeView(APIView):
    """Return message composer context type."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"context_type": "message"})


class GetClientView(APIView):
    """Return basic client information for tests."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        identity = get_chat_identity(request)
        return Response({"client": {"id": identity.id, "username": identity.username}})


class IntroMessageView(APIView):
    """Return an intro message structure."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"id": uuid.uuid4().hex, "custom_type": "channel.intro"})


class ListenersView(APIView):
    """Return available event listeners."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"listeners": ["message.new", "settings.updated"]})


class OffView(APIView):
    """Echo back the event listener to remove."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        event = request.data.get("event")
        return Response({"event": event})


class OnView(APIView):
    """Echo back the event listener to add."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        event = request.data.get("event")
        return Response({"event": event})


class RegisterSubscriptionsView(APIView):
    """Persist and echo back web push subscriptions for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        identity = get_chat_identity(request)
        user = identity.as_user()

        # Frontend may POST with an empty body (Content-Length: 0). Treat that as a no-op.
        data_in = request.data
        if not data_in:
            data_in = {"subscriptions": []}

        serializer = RegisterSubscriptionsSerializer(data=data_in)
        serializer.is_valid(raise_exception=True)

        client_id = serializer.validated_data.get("client_id")
        data = serializer.save(user=user)

        broadcast_subscriptions_registered(user, client_id, data)
        return Response(data, status=status.HTTP_201_CREATED)
