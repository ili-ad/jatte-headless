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


class RoomConfigStateSerializer(serializers.Serializer):
    """Wrap the composer configuration inside the expected envelope."""

    composer = ComposerConfigSerializer()
