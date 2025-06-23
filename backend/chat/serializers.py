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
    class Meta:
        model = Message
        fields = ["id", "body", "sent_by", "created_at"]
        read_only_fields = ["id", "created_at"]

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    cid = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    visible = serializers.SerializerMethodField()

    def get_cid(self, obj: Room) -> str:
        return f"messaging:{obj.uuid}"

    def get_name(self, obj: Room) -> str | None:
        return obj.data.get("name") if obj.data else None

    def get_type(self, obj: Room) -> str:
        return "messaging"

    def get_visible(self, obj: Room) -> bool:
        data = obj.data or {}
        return not data.get("hidden", False)

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
            "visible",
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
