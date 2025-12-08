"""Serializers for the events API surface."""

from datetime import timezone as datetime_timezone

from django.utils import timezone
from rest_framework import serializers

from .models import EventNotification


class RegisterSubscriptionsSerializer(serializers.Serializer):
    """Validate the subscription payload supplied by the client."""

    subscriptions = serializers.DictField(child=serializers.JSONField(), allow_empty=False)


class EventSerializer(serializers.Serializer):
    """Serializer describing the dispatched event payload."""

    type = serializers.CharField()
    payload = serializers.DictField(child=serializers.JSONField(), default=dict, required=False)


class DispatchEventSerializer(serializers.Serializer):
    """Validate dispatch event requests."""

    event = EventSerializer()


class EventNotificationSerializer(serializers.ModelSerializer):
    """Represent persisted event notifications for API responses."""

    type = serializers.CharField(source="event_type")
    ts = serializers.SerializerMethodField()

    class Meta:
        model = EventNotification
        fields = ("type", "payload", "ts")

    def get_ts(self, obj):
        timestamp = obj.created_at
        if timezone.is_naive(timestamp):
            timestamp = timezone.make_aware(timestamp, timezone.get_default_timezone())
        timestamp = timezone.localtime(timestamp, timezone=datetime_timezone.utc)
        return timestamp.isoformat().replace("+00:00", "Z")
