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


class AgentRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentRun
        fields = [
            "run_id",
            "cid",
            "user_id",
            "tools_used",
            "status",
            "latency_ms",
            "tokens_in",
            "tokens_out",
            "cost_usd",
            "created_at",
        ]
