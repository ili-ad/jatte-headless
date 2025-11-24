"""Serializers dedicated to the lightweight rooms API."""

from __future__ import annotations

from rest_framework import serializers

from chat.models import Room


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
