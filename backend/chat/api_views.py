from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from accounts.authentication import SupabaseJWTAuthentication
from django.utils import timezone

from urllib.parse import urlparse
from .models import Room, Message, ReadState, Draft, Notification, Reaction, PollOption, Flag, Pin, UserMute, RoomMute

from .serializers import (
    RoomSerializer,
    MessageSerializer,
    NotificationSerializer,
    ReactionSerializer,
    PollOptionSerializer,
    FlagSerializer,
    PinSerializer,
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

        serializer = MessageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(created_by=request.user)
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


