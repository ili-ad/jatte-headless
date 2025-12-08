from __future__ import annotations

from rest_framework import serializers


class OnCallConfigSerializer(serializers.Serializer):
    phone_e164 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    def validate_phone_e164(self, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        trimmed = value.strip()
        if not trimmed:
            return None
        if not trimmed.startswith("+"):
            raise serializers.ValidationError(
                "Phone number must be in E.164 format (e.g. +15551234567)."
            )
        digits = trimmed[1:]
        if not digits.isdigit():
            raise serializers.ValidationError("Phone number must contain digits only after '+'.")
        if len(trimmed) > 32:
            raise serializers.ValidationError("Phone number is too long.")
        return trimmed

    def validate_email(self, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        trimmed = value.strip()
        return trimmed or None


class EscalationRequestSerializer(serializers.Serializer):
    cid = serializers.CharField()
    reason = serializers.CharField()

    def validate_cid(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("CID is required.")
        return trimmed

    def validate_reason(self, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Reason is required.")
        if len(trimmed) > 255:
            raise serializers.ValidationError("Reason is too long.")
        return trimmed


__all__ = ["OnCallConfigSerializer", "EscalationRequestSerializer"]
