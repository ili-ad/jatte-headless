from __future__ import annotations

from rest_framework import serializers


class SmsWebhookSerializer(serializers.Serializer):
    from_phone = serializers.CharField()
    to_phone = serializers.CharField()
    text = serializers.CharField()
    external_id = serializers.CharField()
    event = serializers.CharField()

    def validate_event(self, value: str) -> str:
        if value != "message":
            raise serializers.ValidationError("Unsupported webhook event")
        return value


class SmsSendSerializer(serializers.Serializer):
    cid = serializers.CharField()
    to = serializers.CharField()
    text = serializers.CharField()

    def validate_text(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Message text is required")
        return value


class SmsReceiptSerializer(serializers.Serializer):
    external_id = serializers.CharField()
    status = serializers.ChoiceField(choices=["delivered", "failed"])
    error_code = serializers.CharField(allow_null=True, allow_blank=True, required=False)
