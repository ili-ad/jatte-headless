import json
import uuid
from urllib.parse import urlparse

import redis
from accounts_supabase.authentication import DevTokenOrJWTAuthentication
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import QueryDict
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .mixins import RoomFromCIDMixin
from .models import (
    Channel,
    Draft,
    Flag,
    Message,
    Notification,
    Pin,
    Poll,
    PollOption,
    Reaction,
    ReadState,
    Reminder,
    Room,
    RoomMemberMute,
    RoomMute,
    UserMute,
)
from .serializers import (
    DraftSerializer,
    FlagSerializer,
    MessageSerializer,
    MessageUpdateSerializer,
    MuteStatusSerializer,
    NotificationSerializer,
    PinSerializer,
    PollOptionSerializer,
    PollSerializer,
    ReactionSerializer,
    RegisterSubscriptionsSerializer,
    ReminderCreateSerializer,
    ReminderSerializer,
    RoomMemberMuteCreateSerializer,
    RoomMemberMuteSerializer,
    RoomSerializer,
    UserMuteUnmuteSerializer,
)


def _user_can_access_room(user, room) -> bool:
    """Return whether ``user`` has access to the given ``room``."""

    username = getattr(user, "username", "")
    return any(
        (
            room.agent_id == getattr(user, "id", None),
            room.client == username,
            room.messages.filter(sent_by=username).exists(),
            getattr(user, "is_staff", False),
            getattr(user, "is_superuser", False),
        )
    )


def _broadcast_reminder_created(room, cid: str, reminder_data: dict) -> None:
    """Notify channel subscribers that a reminder was created."""

    try:
        channel_layer = get_channel_layer()
        cid_value = cid if ":" in cid else f"messaging:{room.uuid}"
        async_to_sync(channel_layer.group_send)(
            f"channel_{room.uuid}",
            {
                "type": "chat.message",
                "payload": {
                    "type": "reminder.created",
                    "cid": cid_value,
                    "reminder": reminder_data,
                },
            },
        )
    except Exception:
        pass


class RoomListCreateView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomMessageListCreateView(RoomFromCIDMixin, generics.ListCreateAPIView):
    """List and create messages for a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

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
        qs = room.messages.order_by("-id")
        before = self.request.query_params.get("before")
        if before:
            try:
                before_id = int(before)
            except ValueError:
                return qs.none()
            qs = qs.filter(id__lt=before_id)
        return qs

    def list(self, request, *args, **kwargs):
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

    def perform_create(self, serializer):
        room = self.get_room()
        channel, _ = Channel.objects.get_or_create(uuid=room.uuid, client=room.client)
        serializer.save(channel=channel, sent_by=self.request.user.username)
        room.messages.add(serializer.instance)
        Draft.objects.filter(user=self.request.user, room=room).delete()
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.delete(f"draft:{self.request.user.username}:{room.uuid}")
        except Exception:
            pass

        try:
            channel_layer = get_channel_layer()
            cid = f"messaging:{room.uuid}"
            message_payload = MessageSerializer(serializer.instance).data
            async_to_sync(channel_layer.group_send)(
                f"channel_{room.uuid}",
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "message.new",
                        "cid": cid,
                        "message": message_payload,
                    },
                },
            )
        except Exception:
            pass


# New Stream Chat API endpoints below


class RoomMessageDetailView(RoomFromCIDMixin, APIView):
    """Retrieve or delete a message in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _get_room(self, cid: str) -> Room:
        if ":" in cid:
            _, room_uuid = cid.split(":", 1)
        else:
            room_uuid = cid
        return get_object_or_404(Room, uuid=room_uuid)

    def _can_manage(self, user, room: Room, message: Message) -> bool:
        if message.sent_by == user.username:
            return True
        if room.agent_id and room.agent_id == user.id:
            return True
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        return False

    def _can_delete(self, user, room: Room, message: Message) -> bool:
        return self._can_manage(user, room, message)

    def _can_update(self, user, room: Room, message: Message) -> bool:
        return self._can_manage(user, room, message)

    def get(self, request, cid: str, message_id: int):
        room = self._get_room(cid)
        message = get_object_or_404(room.messages, id=message_id)
        serializer = MessageSerializer(message)
        return Response(serializer.data)

    def patch(self, request, cid: str, message_id: int):
        room = self._get_room(cid)
        message = get_object_or_404(room.messages, id=message_id)

        if not self._can_update(request.user, room, message):
            return Response(status=403)

        serializer = MessageUpdateSerializer(
            message, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        try:
            channel_layer = get_channel_layer()
            message_payload = serializer.data
            async_to_sync(channel_layer.group_send)(
                f"channel_{room.uuid}",
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "message.updated",
                        "cid": f"messaging:{room.uuid}",
                        "message": message_payload,
                    },
                },
            )
        except Exception:
            pass

        return Response(serializer.data)

    def delete(self, request, cid: str, message_id: int):
        room = self._get_room(cid)
        message = get_object_or_404(room.messages, id=message_id)

        if not self._can_delete(request.user, room, message):
            return Response(status=403)

        deleted_at = timezone.now()
        message.deleted_at = deleted_at
        message.save(update_fields=["deleted_at"])

        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"channel_{room.uuid}",
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "message.deleted",
                        "cid": room.uuid,
                        "message_id": message.id,
                        "deleted_by": request.user.id,
                        "ts": deleted_at.isoformat(),
                    },
                },
            )
        except Exception:
            pass

        return Response(status=204)


class RoomMarkReadView(RoomFromCIDMixin, APIView):
    """Mark all messages in a room as read for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
        ReadState.objects.update_or_create(
            user=request.user,
            room=room,
            defaults={"last_read": timezone.now()},
        )
        return Response({"status": "ok"})


class RoomMarkUnreadView(RoomFromCIDMixin, APIView):
    """Clear the read state for the current user in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
        ReadState.objects.filter(user=request.user, room=room).delete()
        return Response({"status": "ok"})


class RoomCountUnreadView(RoomFromCIDMixin, APIView):
    """Return number of unread messages for the current user in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
        state = ReadState.objects.filter(user=request.user, room=room).first()
        if state is None:
            unread = room.messages.count()
        else:
            unread = room.messages.filter(created_at__gt=state.last_read).count()
        return Response({"unread": unread})


class RoomLastReadView(RoomFromCIDMixin, APIView):
    """Return the last read timestamp for the current user in a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
        state = ReadState.objects.filter(user=request.user, room=room).first()
        last_read = state.last_read.isoformat() if state else None
        return Response({"last_read": last_read})


class RoomReadView(RoomFromCIDMixin, APIView):
    """Return read states for all users in the room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
        states = ReadState.objects.filter(room=room).select_related("user")
        data = []
        for st in states:
            unread = room.messages.filter(created_at__gt=st.last_read).count()
            data.append(
                {
                    "user": st.user.username,
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
        username = request.user.username
        return (
            room.agent_id == request.user.id
            or room.client == username
            or room.messages.filter(sent_by=username).exists()
            or getattr(request.user, "is_staff", False)
            or getattr(request.user, "is_superuser", False)
        )

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
        if not self._user_has_access(request, room):
            return Response(status=403)
        text = request.data.get("text", "")
        Draft.objects.update_or_create(
            user=request.user,
            room=room,
            defaults={"text": text},
        )
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.set(f"draft:{request.user.username}:{room.uuid}", text, ex=86400)
        except Exception:
            pass
        return Response({"status": "ok"})

    def get(self, request, room_uuid):
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
            cached_text = r.get(f"draft:{request.user.username}:{room.uuid}")
        except Exception:
            pass
        draft = Draft.objects.filter(user=request.user, room=room).first()
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
        room = self.get_room(room_uuid)
        if not self._user_has_access(request, room):
            return Response(status=403)
        Draft.objects.filter(user=request.user, room=room).delete()
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
            )
            r.delete(f"draft:{request.user.username}:{room.uuid}")
        except Exception:
            pass
        return Response({"status": "ok"})


class MessageDetailView(APIView):
    """Retrieve, update or delete a single message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        serializer = MessageSerializer(msg)
        return Response(serializer.data)

    def put(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        data = request.data.copy()
        if "text" in data and "body" not in data:
            data["body"] = data.pop("text")
        serializer = MessageSerializer(msg, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        try:
            channel_layer = get_channel_layer()
            cid = f"messaging:{msg.channel.uuid}"
            async_to_sync(channel_layer.group_send)(
                cid.replace(":", "_"),
                {
                    "type": "chat.message",
                    "payload": {"type": "message.updated", "cid": cid, "id": msg.id},
                },
            )
        except Exception:
            pass

        return Response(serializer.data)

    def delete(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        msg.deleted_at = timezone.now()
        msg.save(update_fields=["deleted_at"])

        try:
            channel_layer = get_channel_layer()
            cid = f"messaging:{msg.channel.uuid}"
            async_to_sync(channel_layer.group_send)(
                cid.replace(":", "_"),
                {
                    "type": "chat.message",
                    "payload": {"type": "message.deleted", "cid": cid, "id": msg.id},
                },
            )
        except Exception:
            pass

        return Response(MessageSerializer(msg).data)


class MessageRestoreView(APIView):
    """Restore a previously deleted message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        msg.deleted_at = None
        msg.save(update_fields=["deleted_at"])

        try:
            channel_layer = get_channel_layer()
            cid = f"messaging:{msg.channel.uuid}"
            async_to_sync(channel_layer.group_send)(
                cid.replace(":", "_"),
                {
                    "type": "chat.message",
                    "payload": {"type": "message.updated", "cid": cid, "id": msg.id},
                },
            )
        except Exception:
            pass

        return Response(MessageSerializer(msg).data)


class MessageRepliesView(APIView):
    """Return replies to a given message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        parent = get_object_or_404(Message, id=message_id)
        serializer = MessageSerializer(parent.replies.all(), many=True)
        return Response(serializer.data)


class MessageReactionsView(APIView):
    """List or create reactions for a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        serializer = ReactionSerializer(msg.reactions.all(), many=True)
        return Response(serializer.data)

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        serializer = ReactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reaction = Reaction.objects.create(
            message=msg,
            user=request.user,
            type=serializer.validated_data["type"],
        )
        return Response(ReactionSerializer(reaction).data, status=201)


class MessageFlagView(APIView):
    """Flag a message for moderation."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        flag, _ = Flag.objects.get_or_create(message=msg, user=request.user)
        return Response({"flag": FlagSerializer(flag).data}, status=201)


class ReactionDetailView(APIView):
    """Delete a single reaction."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        flag, _ = Flag.objects.get_or_create(message=msg, user=request.user)
        return Response({"flag": FlagSerializer(flag).data}, status=201)

    def delete(self, request, message_id, reaction_id):
        reaction = get_object_or_404(Reaction, id=reaction_id, message_id=message_id)
        reaction.delete()
        return Response(status=204)


class MessagePinView(APIView):
    """Pin a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        pin, _ = Pin.objects.get_or_create(message=msg, user=request.user)
        return Response({"pin": PinSerializer(pin).data}, status=201)


class MessageUnpinView(APIView):
    """Remove the current user's pin from a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        Pin.objects.filter(message=msg, user=request.user).delete()
        return Response(status=204)


class MessageActionView(APIView):
    """Record an action on a message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        data = request.data or {}
        custom = msg.custom_data or {}
        actions = custom.get("actions", [])
        actions.append(data)
        custom["actions"] = actions
        msg.custom_data = custom
        msg.save(update_fields=["custom_data"])
        return Response({"action": data}, status=201)


class PollOptionCreateView(APIView):
    """Create a new poll option."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, poll_id):
        serializer = PollOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option = PollOption.objects.create(
            poll_id=poll_id,
            text=serializer.validated_data["text"],
            user=request.user,
        )
        return Response({"poll_option": PollOptionSerializer(option).data}, status=201)


class PollListCreateView(APIView):
    """List or create polls."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        polls = Poll.objects.all()
        if polls.count() == 0:
            return Response(status=405)
        serializer = PollSerializer(polls, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        poll = Poll.objects.create(
            question=serializer.validated_data["question"],
            user=request.user,
        )
        for text in request.data.get("options", []):
            PollOption.objects.create(
                poll_id=str(poll.id), text=text, user=request.user
            )
        return Response({"poll": PollSerializer(poll).data}, status=201)


class PollDetailView(APIView):
    """Delete a poll."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, poll_id):
        poll = get_object_or_404(Poll, id=poll_id)
        poll.delete()
        return Response(status=204)


class RoomConfigView(RoomFromCIDMixin, APIView):
    """Return basic metadata for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, cid: str):
        try:
            room_type, room_uuid = cid.split(":", 1)
        except ValueError:
            return Response({"detail": "Invalid cid"}, status=400)

        room = self.get_room(room_uuid)

        name = room.data.get("name") if room.data else None
        muted = RoomMute.objects.filter(user=request.user, room=room).exists()

        return Response({"name": name, "type": room_type, "muted": muted})


class RoomMuteStatusView(RoomFromCIDMixin, APIView):
    """Return mute status for the current user in the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, cid: str):
        room = self.get_room(cid)
        mute = RoomMute.objects.filter(user=request.user, room=room).first()
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
        if acting_user.id == getattr(target_user, "id", None):
            return True
        if room.agent_id and room.agent_id == acting_user.id:
            return True
        if getattr(acting_user, "is_staff", False) or getattr(
            acting_user, "is_superuser", False
        ):
            return True
        return False

    def post(self, request, cid: str):
        room = self.get_room(cid)
        serializer = RoomMemberMuteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_user = serializer.validated_data["user"]
        muted_until = serializer.validated_data.get("muted_until")

        if not self._can_mute(request.user, room, target_user):
            return Response(status=403)

        mute, _created = RoomMemberMute.objects.update_or_create(
            room=room,
            user=target_user,
            defaults={"muted_by": request.user, "muted_until": muted_until},
        )

        response_data = RoomMemberMuteSerializer(mute).data

        try:
            channel_layer = get_channel_layer()
            cid_value = cid if ":" in cid else f"messaging:{room.uuid}"
            async_to_sync(channel_layer.group_send)(
                f"channel_{room.uuid}",
                {
                    "type": "chat.message",
                    "payload": {
                        "type": "member.muted",
                        "cid": cid_value,
                        "user_id": target_user.id,
                        "muted_until": (
                            mute.muted_until.isoformat() if mute.muted_until else None
                        ),
                        "muted_by": request.user.id,
                        "ts": timezone.now().isoformat(),
                    },
                },
            )
        except Exception:
            pass

        return Response(response_data, status=201)


class RoomConfigStateView(RoomFromCIDMixin, APIView):
    """Return message composer configuration for the room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        self.get_room(room_uuid)
        return Response(
            {
                "attachments": {"acceptedFiles": [], "maxNumberOfFilesPerMessage": 10},
                "text": {"enabled": True},
                "multipleUploads": True,
                "isUploadEnabled": True,
            }
        )


class RoomArchiveView(RoomFromCIDMixin, APIView):
    """Archive a room by setting its status to CLOSED."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
        room.status = Room.CLOSED
        room.save()
        return Response({"status": "ok"})


class RoomUnarchiveView(RoomFromCIDMixin, APIView):
    """Reopen a previously archived room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
        room.status = Room.ACTIVE
        room.save()
        return Response({"status": "ok"})


class RoomCooldownView(RoomFromCIDMixin, APIView):
    """Return cooldown seconds for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        self.get_room(room_uuid)
        return Response({"cooldown": 0})


class RoomMembersView(RoomFromCIDMixin, APIView):
    """Return list of members for the given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
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

        room = self.get_room(room_uuid)

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
        room = self.get_room(room_uuid)
        msgs = room.messages.filter(pins__isnull=False).distinct()
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class RoomQueryView(RoomFromCIDMixin, APIView):
    """Return initial messages and members for a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = self.get_room(room_uuid)
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
        return Room.objects.filter(status=Room.ACTIVE)


class NotificationListView(APIView):
    """Return notifications for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notes = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notes, many=True)
        return Response(serializer.data)


class ReminderListCreateView(RoomFromCIDMixin, APIView):
    """List or create reminders for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reminders = Reminder.objects.filter(created_by=request.user)
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    def post(self, request):
        cid = request.data.get("cid")
        if not cid:
            return Response({"cid": ["This field is required."]}, status=400)
        if not isinstance(cid, str):
            return Response({"cid": ["A valid string is required."]}, status=400)
        cid_value = cid.strip()
        if not cid_value:
            return Response({"cid": ["This field may not be blank."]}, status=400)

        room = self.get_room(cid_value)
        if not _user_can_access_room(request.user, room):
            return Response(status=403)

        payload = request.data.copy()
        if hasattr(payload, "pop"):
            payload.pop("cid", None)
        else:
            payload = {k: v for k, v in payload.items() if k != "cid"}

        serializer = ReminderCreateSerializer(
            data=payload, context={"room": room, "user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        reminder_data = ReminderSerializer(reminder).data

        _broadcast_reminder_created(room, cid_value, reminder_data)

        return Response(reminder_data, status=201)


class RoomReminderCreateView(RoomFromCIDMixin, APIView):
    """Create a reminder scoped to a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, cid: str):
        room = self.get_room(cid)
        if not _user_can_access_room(request.user, room):
            return Response(status=403)
        serializer = ReminderCreateSerializer(
            data=request.data, context={"room": room, "user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        reminder_data = ReminderSerializer(reminder).data

        _broadcast_reminder_created(room, cid, reminder_data)

        return Response(reminder_data, status=201)


class ThreadListView(APIView):
    """Return parent messages that have replies."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        msgs = Message.objects.filter(replies__isnull=False).distinct()
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class MutedChannelListView(APIView):
    """Return channels muted by the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        mutes = RoomMute.objects.filter(user=request.user)
        rooms = [m.room for m in mutes]
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class MuteStatusView(APIView):
    """Return whether the current user muted the given user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, target_username):
        target = get_object_or_404(get_user_model(), username=target_username)
        muted = UserMute.objects.filter(user=request.user, target=target).exists()
        return Response({"muted": muted})


class MutedUsersView(APIView):
    """Return list of users muted by the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = UserMute.objects.filter(user=request.user).select_related("target")
        data = [{"id": m.target.id, "username": m.target.username} for m in qs]
        return Response(data)


class MuteUserView(APIView):
    """Mute the given user for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, target_username):
        target = get_object_or_404(get_user_model(), username=target_username)
        UserMute.objects.get_or_create(user=request.user, target=target)
        return Response({"status": "ok"})


class UnmuteUserView(APIView):
    """Remove a global mute for the given target user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserMuteUnmuteSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return Response(payload, status=status.HTTP_200_OK)


class AttachmentUploadView(APIView):
    """Create a simple attachment record."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get("name", "")
        att_id = uuid.uuid4()
        return Response({"attachment": {"id": str(att_id), "name": name}}, status=201)


class LinkPreviewView(APIView):
    """Return basic metadata for a URL."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get("url", "")
        if not url:
            return Response({"error": "url required"}, status=400)
        parsed = urlparse(url)
        title = parsed.netloc or url
        return Response({"url": url, "title": title})


class RoomHideView(RoomFromCIDMixin, APIView):
    """Mark a room as hidden for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = self.get_room(room_uuid)
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
        room = self.get_room(room_uuid)
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
        room = self.get_room(room_uuid)
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
        rooms = Room.objects.filter(status=Room.ACTIVE)
        room_data = RoomSerializer(rooms, many=True).data
        notes = Notification.objects.filter(user=request.user)
        note_data = NotificationSerializer(notes, many=True).data
        return Response({"rooms": room_data, "notifications": note_data})


class SubarrayView(APIView):
    """Return a slice of the given array."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        array = request.data.get("array", [])
        if hasattr(request.data, "getlist") and request.data.getlist("array"):
            array = request.data.getlist("array")
        elif isinstance(array, str):
            try:
                parsed = json.loads(array)
                array = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                array = [array]
        elif not isinstance(array, list):
            try:
                q = QueryDict(request.body)
                array = q.getlist("array") or [array]
            except Exception:
                array = [array]
        start_raw = request.data.get("start", 0)
        if isinstance(start_raw, list):
            start_raw = start_raw[0]
        end_raw = request.data.get("end")
        if isinstance(end_raw, list):
            end_raw = end_raw[0]
        start = int(start_raw)
        end = int(end_raw) if end_raw is not None else None
        if not isinstance(array, list):
            return Response({"error": "array must be a list"}, status=400)
        slice_result = array[start:end] if end is not None else array[start:]
        result = [
            int(x) if isinstance(x, str) and x.isdigit() else x for x in slice_result
        ]
        return Response({"result": result})


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
        return Response({"users": []})


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


class QuotedMessageView(APIView):
    """Store and retrieve quoted message for the current user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.session["quoted_message"] = request.data.get("quoted_message")
        return Response({"status": "ok"})

    def get(self, request):
        msg = request.session.get("quoted_message")
        return Response({"quoted_message": msg})


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
            r.set(f"cid:{cid}", request.user.username, ex=60)
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
        user = request.user
        return Response({"client": {"id": user.id, "username": user.username}})


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
        serializer = RegisterSubscriptionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save(user=request.user)
        return Response(data, status=status.HTTP_201_CREATED)
