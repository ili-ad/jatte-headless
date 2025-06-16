from rest_framework import serializers
from .models import Room, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "body",
            "sent_by",
            "created_at",
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
