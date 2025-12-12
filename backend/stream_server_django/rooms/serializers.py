"""Serializers dedicated to the lightweight rooms API."""

from __future__ import annotations

from rest_framework import serializers

from stream_server_django.chat.models import Message, Room


class RoomListSerializer(serializers.ModelSerializer):
    """Expose the subset of room fields needed by the shim handshake."""

    name = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ["id", "uuid", "name", "data"]
        read_only_fields = fields

    def get_name(self, obj: Room) -> str | None:
        """Return the optional display name stored in the room's data blob."""

        if not obj.data:
            return None
        name = obj.data.get("name")
        return name if isinstance(name, str) else None


class ComposerConfigSerializer(serializers.Serializer):
    """Represent the composer configuration returned to the shim."""

    file_uploads = serializers.BooleanField()
    max_length = serializers.IntegerField(required=False)
    cooldown_seconds = serializers.IntegerField(required=False)


class AIConfigSerializer(serializers.Serializer):
    """Expose AI assistant settings for the current room."""

    enabled = serializers.BooleanField()
    botUserId = serializers.CharField()
    displayName = serializers.CharField()
    personaSummary = serializers.CharField(required=False, allow_null=True)


class RoomConfigSerializer(serializers.Serializer):
    """Top-level room config payload."""

    composer = ComposerConfigSerializer()
    ai = AIConfigSerializer()


class RoomConfigStateSerializer(serializers.Serializer):
    """Wrap the room config inside the expected envelope."""

    config = RoomConfigSerializer()


class MessageContractSerializer(serializers.ModelSerializer):
    """Minimal message shape expected by the chat-contract frontend."""

    text = serializers.CharField(source="body")
    user_id = serializers.SerializerMethodField()
    client_generated_id = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "text",
            "user_id",
            "created_at",
            "updated_at",
            "deleted_at",
            "client_generated_id",
        ]
        read_only_fields = fields

    def get_user_id(self, obj: Message) -> str | None:
        return obj.sent_by or None

    def get_client_generated_id(self, obj: Message) -> str | None:
        value = None
        if isinstance(obj.custom_data, dict):
            value = obj.custom_data.get("client_generated_id")
        return value if isinstance(value, str) else None


class MessageContractCreateSerializer(serializers.Serializer):
    """Validate the minimal message payload accepted by the echo API."""

    body = serializers.CharField(required=False, allow_blank=True)
    text = serializers.CharField(required=False, allow_blank=True)
    custom_data = serializers.DictField(required=False, default=dict)
    client_generated_id = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )

    def validate(self, attrs: dict) -> dict:
        body = attrs.get("body")
        text = attrs.get("text")
        if not isinstance(body, str) and not isinstance(text, str):
            raise serializers.ValidationError(
                {"detail": "A 'text' or 'body' field is required."}
            )

        message_body = body if isinstance(body, str) else text
        attrs["body"] = message_body if message_body is not None else ""

        custom_data = attrs.get("custom_data")
        if not isinstance(custom_data, dict):
            attrs["custom_data"] = {}

        client_generated_id = attrs.get("client_generated_id")
        if client_generated_id is not None and not isinstance(client_generated_id, str):
            raise serializers.ValidationError(
                {"client_generated_id": "Must be a string when provided."}
            )

        return attrs
