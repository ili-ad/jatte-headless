from __future__ import annotations

from rest_framework import serializers


class QueueRoomSerializer(serializers.Serializer):
    cid = serializers.CharField()
    name = serializers.CharField(allow_null=True, required=False)
    last_message_at = serializers.DateTimeField(allow_null=True)
    last_text = serializers.CharField(allow_null=True, required=False)
    owner_id = serializers.CharField(allow_null=True, required=False)
    unread_count = serializers.IntegerField()


class ClaimRoomSerializer(serializers.Serializer):
    cid = serializers.CharField()
    owner_id = serializers.CharField()
    claimed_at = serializers.DateTimeField()
