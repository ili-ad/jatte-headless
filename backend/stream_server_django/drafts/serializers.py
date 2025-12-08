"""Serializers for the draft persistence API."""

from __future__ import annotations

from rest_framework import serializers

from stream_server_django.chat.models import Draft


class DraftSerializer(serializers.ModelSerializer):
    """Expose the persisted draft in the shape expected by the shim."""

    class Meta:
        model = Draft
        fields = ["text", "updated_at"]
        read_only_fields = ["updated_at"]
        extra_kwargs = {
            "text": {"allow_blank": True, "trim_whitespace": False},
        }
