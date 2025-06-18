from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from accounts.authentication import SupabaseJWTAuthentication
from django.utils import timezone

from urllib.parse import urlparse
import uuid
import json
from django.http import QueryDict
from .models import (
    Room,
    Message,
    ReadState,
    Draft,
    Notification,
    Reaction,
    PollOption,
    Poll,
    Flag,
    Pin,
    UserMute,
    RoomMute,
    Reminder,
)

from .serializers import (
    RoomSerializer,
    MessageSerializer,
    NotificationSerializer,
    ReactionSerializer,
    PollOptionSerializer,
    PollSerializer,
    FlagSerializer,
    PinSerializer,
    ReminderSerializer,
)



class RoomListCreateView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomMessageListCreateView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        serializer = MessageSerializer(room.messages.all(), many=True)
        return Response(serializer.data)

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        data = request.data.copy()

        # allow simple "text" payloads from the adapter
        if "text" in data and "body" not in data:
            data["body"] = data.pop("text")
        if "sent_by" not in data:
            data["sent_by"] = request.user.username

        event = data.pop("event", None)
        if event is not None:
            cd = data.get("custom_data", {}) or {}
            if not isinstance(cd, dict):
                cd = {}
            cd["event"] = event
            data["custom_data"] = cd

        parent_id = data.pop("reply_to", None)
        serializer = MessageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        reply_to = None
        if parent_id is not None:
            reply_to = get_object_or_404(Message, id=parent_id)
        message = serializer.save(created_by=request.user, reply_to=reply_to)
        room.messages.add(message)
        return Response(MessageSerializer(message).data, status=201)


# New Stream Chat API endpoints below


class RoomMarkReadView(APIView):
    """Mark all messages in a room as read for the current user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        ReadState.objects.update_or_create(
            user=request.user,
            room=room,
            defaults={"last_read": timezone.now()},
        )
        return Response({"status": "ok"})


class RoomMarkUnreadView(APIView):
    """Clear the read state for the current user in a room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        ReadState.objects.filter(user=request.user, room=room).delete()
        return Response({"status": "ok"})


class RoomCountUnreadView(APIView):
    """Return number of unread messages for the current user in a room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        state = ReadState.objects.filter(user=request.user, room=room).first()
        if state is None:
            unread = room.messages.count()
        else:
            unread = room.messages.filter(created_at__gt=state.last_read).count()
        return Response({"unread": unread})


class RoomLastReadView(APIView):
    """Return the last read timestamp for the current user in a room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        state = ReadState.objects.filter(user=request.user, room=room).first()
        last_read = state.last_read.isoformat() if state else None
        return Response({"last_read": last_read})


class RoomReadView(APIView):
    """Return read states for all users in the room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
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


class RoomDraftView(APIView):
    """Save and retrieve message drafts."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        text = request.data.get("text", "")
        Draft.objects.update_or_create(
            user=request.user,
            room=room,
            defaults={"text": text},
        )
        return Response({"status": "ok"})

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        draft = Draft.objects.filter(user=request.user, room=room).first()
        return Response({"text": draft.text if draft else ""})

    def delete(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        Draft.objects.filter(user=request.user, room=room).delete()
        return Response({"status": "ok"})


class MessageDetailView(APIView):
    """Retrieve, update or delete a single message."""
    authentication_classes = [SupabaseJWTAuthentication]
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
        return Response(serializer.data)

    def delete(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        msg.deleted_at = timezone.now()
        msg.save(update_fields=["deleted_at"])
        return Response(MessageSerializer(msg).data)


class MessageRestoreView(APIView):
    """Restore a previously deleted message."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        msg.deleted_at = None
        msg.save(update_fields=["deleted_at"])
        return Response(MessageSerializer(msg).data)


class MessageRepliesView(APIView):
    """Return replies to a given message."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, message_id):
        parent = get_object_or_404(Message, id=message_id)
        serializer = MessageSerializer(parent.replies.all(), many=True)
        return Response(serializer.data)


class MessageReactionsView(APIView):
    """List or create reactions for a message."""
    authentication_classes = [SupabaseJWTAuthentication]
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

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        flag, _ = Flag.objects.get_or_create(message=msg, user=request.user)
        return Response({"flag": FlagSerializer(flag).data}, status=201)    

      
      
class ReactionDetailView(APIView):
    """Delete a single reaction."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        flag, _ = Flag.objects.get_or_create(message=msg, user=request.user)
        return Response({"flag": FlagSerializer(flag).data}, status=201)

    def delete(self, request, message_id, reaction_id):
        reaction = get_object_or_404(
            Reaction, id=reaction_id, message_id=message_id
        )
        reaction.delete()
        return Response(status=204)


class MessagePinView(APIView):
    """Pin a message."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        pin, _ = Pin.objects.get_or_create(message=msg, user=request.user)
        return Response({"pin": PinSerializer(pin).data}, status=201)


class MessageUnpinView(APIView):
    """Remove the current user's pin from a message."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, message_id):
        msg = get_object_or_404(Message, id=message_id)
        Pin.objects.filter(message=msg, user=request.user).delete()
        return Response(status=204)


class MessageActionView(APIView):
    """Record an action on a message."""

    authentication_classes = [SupabaseJWTAuthentication]
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

    authentication_classes = [SupabaseJWTAuthentication]
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

    authentication_classes = [SupabaseJWTAuthentication]
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
            PollOption.objects.create(poll_id=str(poll.id), text=text, user=request.user)
        return Response({"poll": PollSerializer(poll).data}, status=201)


class PollDetailView(APIView):
    """Delete a poll."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, poll_id):
        poll = get_object_or_404(Poll, id=poll_id)
        poll.delete()
        return Response(status=204)

class RoomConfigView(APIView):
    """Return configuration flags for the given room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        # For now return static configuration matching adapter defaults
        get_object_or_404(Room, uuid=room_uuid)
        return Response(
            {
                "typing_events": True,
                "read_events": True,
                "reactions": True,
                "uploads": True,
            }
        )

class RoomConfigStateView(APIView):
    """Return message composer configuration for the room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, room_uuid):
        get_object_or_404(Room, uuid=room_uuid)
        return Response({
            "attachments": {"acceptedFiles": [], "maxNumberOfFilesPerMessage": 10},
            "text": {"enabled": True},
            "multipleUploads": True,
            "isUploadEnabled": True,
        })


class RoomArchiveView(APIView):
    """Archive a room by setting its status to CLOSED."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        room.status = Room.CLOSED
        room.save()
        return Response({"status": "ok"})


class RoomUnarchiveView(APIView):
    """Reopen a previously archived room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        room.status = Room.ACTIVE
        room.save()
        return Response({"status": "ok"})


class RoomCooldownView(APIView):
    """Return cooldown seconds for the given room."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        get_object_or_404(Room, uuid=room_uuid)
        return Response({"cooldown": 0})


class RoomMembersView(APIView):
    """Return list of members for the given room."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        names = set(room.messages.values_list("sent_by", flat=True))
        if room.client:
            names.add(room.client)
        if room.agent:
            names.add(room.agent.username)
        return Response([{"id": name} for name in sorted(names)])


class RoomPinnedMessagesView(APIView):
    """Return messages pinned in the given room."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        msgs = room.messages.filter(pins__isnull=False).distinct()
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class RoomQueryView(APIView):
    """Return initial messages and members for a room."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        messages = MessageSerializer(room.messages.all(), many=True).data
        names = set(room.messages.values_list("sent_by", flat=True))
        if room.agent:
            names.add(room.agent.username)
        members = [{"id": name} for name in sorted(names)]
        return Response({"messages": messages, "members": members})


class ActiveRoomListView(generics.ListAPIView):
    """Return all rooms currently marked as ACTIVE."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoomSerializer

    def get_queryset(self):
        return Room.objects.filter(status=Room.ACTIVE)


class NotificationListView(APIView):
    """Return notifications for the current user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notes = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notes, many=True)
        return Response(serializer.data)


class ReminderListCreateView(APIView):
    """List or create reminders for the current user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reminders = Reminder.objects.filter(user=request.user)
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReminderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reminder = Reminder.objects.create(
            user=request.user,
            text=serializer.validated_data["text"],
            remind_at=serializer.validated_data["remind_at"],
        )
        return Response({"reminder": ReminderSerializer(reminder).data}, status=201)


class ThreadListView(APIView):
    """Return parent messages that have replies."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        msgs = Message.objects.filter(replies__isnull=False).distinct()
        serializer = MessageSerializer(msgs, many=True)
        return Response(serializer.data)


class MutedChannelListView(APIView):
    """Return channels muted by the current user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        mutes = RoomMute.objects.filter(user=request.user)
        rooms = [m.room for m in mutes]
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class MuteStatusView(APIView):
    """Return whether the current user muted the given user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, target_username):
        target = get_object_or_404(get_user_model(), username=target_username)
        muted = UserMute.objects.filter(user=request.user, target=target).exists()
        return Response({"muted": muted})


class MutedUsersView(APIView):
    """Return list of users muted by the current user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = UserMute.objects.filter(user=request.user).select_related("target")
        data = [{"id": m.target.id, "username": m.target.username} for m in qs]
        return Response(data)

      
class MuteUserView(APIView):
    """Mute the given user for the current user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, target_username):
        target = get_object_or_404(get_user_model(), username=target_username)
        UserMute.objects.get_or_create(user=request.user, target=target)
        return Response({"status": "ok"})


class UnmuteUserView(APIView):
    """Remove mute record for the given user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, target_username):
        target = get_object_or_404(get_user_model(), username=target_username)
        UserMute.objects.filter(user=request.user, target=target).delete()
        return Response({"status": "ok"})


class AttachmentUploadView(APIView):
    """Create a simple attachment record."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get("name", "")
        att_id = uuid.uuid4()
        return Response({"attachment": {"id": str(att_id), "name": name}}, status=201)
      
      
class LinkPreviewView(APIView):
    """Return basic metadata for a URL."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get("url", "")
        if not url:
            return Response({"error": "url required"}, status=400)
        parsed = urlparse(url)
        title = parsed.netloc or url
        return Response({"url": url, "title": title})

      
class RoomHideView(APIView):
    """Mark a room as hidden for the current user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        data = room.data or {}
        data["hidden"] = True
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RoomShowView(APIView):
    """Unhide a room previously hidden."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        data = room.data or {}
        data["hidden"] = False
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RoomTruncateView(APIView):
    """Remove all messages from a room."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        room.messages.clear()
        data = room.data or {}
        data["truncated"] = True
        room.data = data
        room.save(update_fields=["data"])
        return Response({"status": "ok"})


class RecoverStateView(APIView):
    """Return basic state for reconnect recovery."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = Room.objects.filter(status=Room.ACTIVE)
        room_data = RoomSerializer(rooms, many=True).data
        notes = Notification.objects.filter(user=request.user)
        note_data = NotificationSerializer(notes, many=True).data
        return Response({"rooms": room_data, "notifications": note_data})


class SubarrayView(APIView):
    """Return a slice of the given array."""

    authentication_classes = [SupabaseJWTAuthentication]
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
        result = [int(x) if isinstance(x, str) and x.isdigit() else x for x in slice_result]
        return Response({"result": result})



class TextComposerView(APIView):
    """Echo back posted text for tests."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")
        return Response({"text": text})


class ComposeView(APIView):
    """Echo back posted composition for tests."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"composition": request.data})


class CompositionIsEmptyView(APIView):
    """Return whether posted text is empty after trimming."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "")
        is_empty = str(text).strip() == ""
        return Response({"is_empty": is_empty})


class HasSendableDataView(APIView):
    """Return whether posted composition includes sendable data."""

    authentication_classes = [SupabaseJWTAuthentication]
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

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "text": "",
            "attachments": [],
            "poll": None,
            "custom_data": {},
            "quoted_message": None,
        })


class DispatchEventView(APIView):
    """Echo back posted event for tests."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"event": request.data})


class EditingAuditStateView(APIView):
    """Echo back posted editing audit state for tests."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        draft_update = request.data.get("draft_update")
        state_update = request.data.get("state_update")
        return Response({"draft_update": draft_update, "state_update": state_update})


class AxiosTestView(APIView):
    """Simple endpoint used by axiosInstance tests."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"method": "GET"})

    def post(self, request):
        return Response({"method": "POST", "data": request.data})

    def delete(self, request):
        return Response({"method": "DELETE"})


class WsAuthView(APIView):
    """Simple handshake endpoint for websocket connections."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"status": "ok"})


class ConnectionIDView(APIView):
    """Return a random connection identifier."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"connection_id": uuid.uuid4().hex})


class ContextTypeView(APIView):
    """Return message composer context type."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"context_type": "message"})


class GetClientView(APIView):
    """Return basic client information for tests."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({"client": {"id": user.id, "username": user.username}})
