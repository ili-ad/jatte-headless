from __future__ import annotations

from typing import Iterable

from django.utils import timezone
from rest_framework import serializers

from .models import Poll, PollAnswer, PollOption, PollVote, normalize_cid


class PollOptionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ["id", "text", "created_at"]
        read_only_fields = fields

    def get_id(self, obj: PollOption) -> str:
        return str(obj.id)


class PollSerializer(serializers.ModelSerializer):
    poll_id = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ["poll_id", "cid", "question", "options", "created_at"]
        read_only_fields = fields

    def get_poll_id(self, obj: Poll) -> str:
        return str(obj.id)

    def get_options(self, obj: Poll) -> Iterable[dict]:
        options = getattr(obj, "prefetched_options", None)
        if options is None:
            options = obj.options.all()
        return PollOptionSerializer(options, many=True).data


class PollCreateSerializer(serializers.Serializer):
    cid = serializers.CharField(max_length=255)
    question = serializers.CharField(max_length=255)
    options = serializers.ListField(
        child=serializers.CharField(max_length=255),
        allow_empty=False,
    )

    def validate_cid(self, value: str) -> str:
        try:
            return normalize_cid(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc


class PollOptionCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=255)


class PollAnswerCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000)


class PollVoteListSerializer(serializers.ModelSerializer):
    user_id = serializers.SerializerMethodField()
    ts = serializers.SerializerMethodField()

    class Meta:
        model = PollVote
        fields = ["user_id", "ts"]
        read_only_fields = fields

    def get_user_id(self, obj: PollVote) -> str:
        return str(obj.user_id)

    def get_ts(self, obj: PollVote) -> str:
        return obj.created_at.isoformat()


class PollAnswerSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = PollAnswer
        fields = ["id", "text", "created_at", "updated_at"]
        read_only_fields = fields

    def get_id(self, obj: PollAnswer) -> str:
        return str(obj.id)


def serialize_vote(vote: PollVote) -> dict:
    user = vote.user
    user_data = None
    if user:
        name = user.get_full_name() or user.get_username() or str(user.pk)
        user_data = {
            "id": str(user.pk),
            "name": name,
        }
        if getattr(user, "email", None):
            user_data["email"] = user.email
    return {
        "id": str(vote.id),
        "poll_id": str(vote.poll_id),
        "option_id": str(vote.option_id),
        "user_id": str(vote.user_id),
        "user": user_data,
        "created_at": vote.created_at.isoformat(),
        "updated_at": vote.updated_at.isoformat(),
    }


def current_timestamp() -> str:
    return timezone.now().isoformat()
