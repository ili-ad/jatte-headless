"""Serializers for the State & Recovery domain."""

from __future__ import annotations

from rest_framework import serializers


class RoomSnapshotSerializer(serializers.Serializer):
    """Minimal room representation required for state hydration."""

    id = serializers.IntegerField()
    uuid = serializers.CharField()
    name = serializers.CharField(allow_blank=True, allow_null=True)
    data = serializers.DictField(child=serializers.JSONField(), default=dict)


class NotificationSnapshotSerializer(serializers.Serializer):
    """Lightweight notification payload used during recovery."""

    type = serializers.CharField()
    payload = serializers.DictField(child=serializers.JSONField())
    ts = serializers.DateTimeField()


class EditingAuditStateSerializer(serializers.Serializer):
    """Validate the audit echo payload used for diagnostics."""

    draft_update = serializers.IntegerField()
    state_update = serializers.IntegerField()
