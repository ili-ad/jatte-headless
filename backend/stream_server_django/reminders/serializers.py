from __future__ import annotations

import datetime

from django.utils import timezone
from rest_framework import serializers

from .models import Reminder


def normalize_cid(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if ":" not in value:
        value = f"messaging:{value}"
    return value


class ReminderOut(serializers.ModelSerializer):
    remind_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%SZ")

    class Meta:
        model = Reminder
        fields = ["id", "text", "remind_at"]


class ReminderIn(serializers.Serializer):
    text = serializers.CharField(max_length=255)
    remind_at = serializers.DateTimeField()
    cid = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_text(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def validate_remind_at(self, value):
        if timezone.is_naive(value):
            value = timezone.make_aware(value)
        return value.astimezone(datetime.timezone.utc)

    def validate_cid(self, value):
        return normalize_cid(value)

    def create(self, validated_data):
        user = self.context["user"]
        cid = validated_data.get("cid")
        reminder = Reminder.objects.create(
            user=user,
            text=validated_data["text"],
            remind_at=validated_data["remind_at"],
            cid=cid,
        )
        return reminder
