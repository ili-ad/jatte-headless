from __future__ import annotations

from rest_framework import serializers


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
