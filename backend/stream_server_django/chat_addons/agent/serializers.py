from __future__ import annotations

from rest_framework import serializers

from .models import AgentRoomPolicy, AgentRun


class SkillToggleSerializer(serializers.Serializer):
    name = serializers.CharField()
    enabled = serializers.BooleanField()


class SkillListItemSerializer(SkillToggleSerializer):
    description = serializers.CharField()


class RoomSkillPolicySerializer(serializers.Serializer):
    cid = serializers.CharField()
    skills = SkillToggleSerializer(many=True)


class RoomSkillListSerializer(serializers.Serializer):
    cid = serializers.CharField()
    skills = SkillListItemSerializer(many=True)


class AgentRunListQuerySerializer(serializers.Serializer):
    cid = serializers.CharField()
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100)
    cursor = serializers.CharField(required=False, allow_blank=False)


class AgentMemoryListQuerySerializer(serializers.Serializer):
    cid = serializers.CharField()
    limit = serializers.IntegerField(required=False, min_value=1, max_value=100)
    cursor = serializers.CharField(required=False, allow_blank=False)


class AgentMemoryEntrySerializer(serializers.Serializer):
    text = serializers.CharField()
    role = serializers.ChoiceField(choices=["human", "agent", "system"])
    created_at = serializers.DateTimeField()


class AgentMemoryListSerializer(serializers.Serializer):
    results = AgentMemoryEntrySerializer(many=True)
    next = serializers.CharField(required=False, allow_null=True, default=None)


class AgentRoomPolicySerializer(serializers.ModelSerializer):
    enabled_skills = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
        required=False,
    )

    class Meta:
        model = AgentRoomPolicy
        fields = [
            "cid",
            "agent_enabled",
            "enabled_skills",
            "tool_hop_cap",
            "turn_cap",
            "auto_reply_mode",
            "handoff_message",
        ]


class AgentRunSummarySerializer(serializers.ModelSerializer):
    ts = serializers.DateTimeField(source="created_at")
    cost_usd = serializers.DecimalField(
        max_digits=10,
        decimal_places=6,
        coerce_to_string=False,
    )

    class Meta:
        model = AgentRun
        fields = [
            "ts",
            "status",
            "tools_used",
            "latency_ms",
            "tokens_in",
            "tokens_out",
            "cost_usd",
            "run_id",
        ]


class AgentSimulateRequestSerializer(serializers.Serializer):
    cid = serializers.CharField()
    prompt = serializers.CharField(allow_blank=False, trim_whitespace=True)
    meta = serializers.DictField(
        child=serializers.JSONField(), required=False, default=dict
    )


class AgentInvocationSerializer(serializers.Serializer):
    room_uuid = serializers.CharField()
    last_human_message_id = serializers.IntegerField()
    client_generated_id = serializers.CharField(required=False, allow_blank=True)
    trace_id = serializers.CharField(required=False, allow_blank=True)
