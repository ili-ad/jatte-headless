from rest_framework import serializers
from .models import Room, Message, Notification, Reaction, PollOption, Flag


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "body",
            "sent_by",
            "created_at",
            "custom_data",
            "created_by",
            "reply_to",
        ]
        read_only_fields = ["id", "created_at", "created_by", "reply_to"]

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    cid = serializers.SerializerMethodField()

    def get_cid(self, obj: Room) -> str:
        return f"messaging:{obj.uuid}"

    class Meta:
        model = Room
        fields = [
            "id",
            "uuid",
            "cid",
            "client",
            "agent",
            "messages",
            "url",
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


class PollOptionSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = PollOption
        fields = ["id", "poll_id", "text", "user_id", "created_at"]
        read_only_fields = ["id", "poll_id", "user_id", "created_at"]
