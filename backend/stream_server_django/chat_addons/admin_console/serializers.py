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


class GatingRulesSerializer(serializers.Serializer):
    languages = serializers.ListField(
        child=serializers.CharField(), allow_empty=True, default=list
    )
    min_length = serializers.IntegerField(min_value=0)
    max_length = serializers.IntegerField(min_value=1)
    min_interval_seconds = serializers.IntegerField(min_value=0)
    blocklist = serializers.ListField(
        child=serializers.CharField(), allow_empty=True, default=list
    )


class IntakeItemSerializer(serializers.Serializer):
    message_id = serializers.CharField()
    cid = serializers.CharField()
    user_id = serializers.CharField()
    text = serializers.CharField()
    created_at = serializers.DateTimeField()
    status = serializers.CharField()
    reason = serializers.CharField(allow_null=True, required=False)


class IntakeListResponseSerializer(serializers.Serializer):
    results = IntakeItemSerializer(many=True)
    next = serializers.CharField(allow_null=True, required=False)


class IntakeActionResponseSerializer(serializers.Serializer):
    message_id = serializers.CharField()
    status = serializers.CharField()
    muted = serializers.BooleanField()
