from rest_framework import serializers
from .models import Room, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "body", "sent_by", "created_at", "created_by"]
        read_only_fields = ["id", "created_at", "created_by"]

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            "id",
            "uuid",
            "client",
            "agent",
            "messages",
            "url",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
