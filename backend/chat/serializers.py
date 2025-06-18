from rest_framework import serializers
from .models import (
    Room,
    Message,
    Notification,
    Reaction,
    PollOption,
    Poll,
    Flag,
    Reminder,
    Pin,
)


class MessageSerializer(serializers.ModelSerializer):
    event = serializers.SerializerMethodField()
    reply_to = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "body",
            "sent_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "custom_data",
            "created_by",
            "reply_to",
            "event",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def get_event(self, obj):
        return obj.custom_data.get("event")

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    cid = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    def get_cid(self, obj: Room) -> str:
        return f"messaging:{obj.uuid}"

    def get_name(self, obj: Room) -> str | None:
        return obj.data.get("name") if obj.data else None

    def get_type(self, obj: Room) -> str:
        return "messaging"

    class Meta:
        model = Room
        fields = [
            "id",
            "uuid",
            "cid",
            "name",
            "type",
            "client",
            "agent",
            "messages",
            "url",
            "data",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "text", "created_at"]

        
class ReactionSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Reaction
        fields = ["id", "type", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class FlagSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Flag
        fields = ["id", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class PinSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Pin
        fields = ["id", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class PollOptionSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = PollOption
        fields = ["id", "poll_id", "text", "user_id", "created_at"]
        read_only_fields = ["id", "poll_id", "user_id", "created_at"]


class PollSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Poll
        fields = ["id", "question", "user_id", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ["id", "text", "remind_at", "created_at"]
        read_only_fields = ["id", "created_at"]
