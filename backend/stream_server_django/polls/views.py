from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Poll, PollAnswer, PollOption, PollVote, normalize_cid
from .serializers import (
    PollAnswerCreateSerializer,
    PollAnswerSerializer,
    PollCreateSerializer,
    PollOptionCreateSerializer,
    PollOptionSerializer,
    PollSerializer,
    PollVoteListSerializer,
    current_timestamp,
    serialize_vote,
)

DEFAULT_PAGE_SIZE = 30
MAX_PAGE_SIZE = 100


def _parse_limit(raw: Optional[str]) -> int:
    if raw is None:
        return DEFAULT_PAGE_SIZE
    try:
        value = int(raw)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
        raise ValueError("limit must be an integer") from exc
    value = max(1, min(value, MAX_PAGE_SIZE))
    return value


@dataclass(frozen=True)
class Cursor:
    created_at: datetime
    identifier: uuid.UUID

    def encode(self) -> str:
        return f"{self.created_at.isoformat()}|{self.identifier}"

    @staticmethod
    def decode(raw: str) -> "Cursor":
        if "|" not in raw:
            raise ValueError("Invalid cursor")
        created_at, identifier = raw.split("|", 1)
        dt = parse_datetime(created_at)
        if dt is None:
            raise ValueError("Invalid cursor timestamp")
        try:
            option_uuid = uuid.UUID(identifier)
        except ValueError as exc:
            raise ValueError("Invalid cursor identifier") from exc
        return Cursor(created_at=dt, identifier=option_uuid)

    def as_filters(self) -> Q:
        return Q(created_at__lt=self.created_at) | (
            Q(created_at=self.created_at) & Q(id__lt=self.identifier)
        )


def _broadcast_poll_event(poll: Poll, payload: dict) -> None:
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        cid = poll.cid
        async_to_sync(channel_layer.group_send)(
            f"channel_{cid.replace(':', '_')}",
            {"type": "chat.message", "payload": payload},
        )
    except Exception:
        pass


class PollListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cid_param = request.query_params.get("cid")
        if not cid_param:
            return Response(
                {"detail": "cid query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            cid = normalize_cid(cid_param)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            limit = _parse_limit(request.query_params.get("limit"))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        cursor_param = request.query_params.get("cursor")
        filters = Q(cid=cid)
        if cursor_param:
            try:
                cursor = Cursor.decode(cursor_param)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            filters &= cursor.as_filters()

        polls_qs = (
            Poll.objects.filter(filters)
            .order_by("-created_at", "-id")
            .prefetch_related("options")
        )

        items = list(polls_qs[: limit + 1])
        has_next = len(items) > limit
        page = items[:limit]
        next_cursor = None
        if has_next and page:
            last = page[-1]
            next_cursor = Cursor(
                created_at=last.created_at,
                identifier=last.id,
            ).encode()

        serializer = PollSerializer(page, many=True)
        return Response({"results": serializer.data, "next": next_cursor})

    def post(self, request):
        serializer = PollCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            poll = Poll.objects.create(
                cid=data["cid"],
                question=data["question"],
                created_by=request.user,
            )
            options = [
                PollOption.objects.create(
                    poll=poll,
                    text=text,
                    created_by=request.user,
                )
                for text in data.get("options", [])
            ]

        poll.prefetched_options = options
        payload = PollSerializer(poll).data
        return Response({"poll": payload}, status=status.HTTP_201_CREATED)


class PollOptionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, poll_id: str):
        poll = get_object_or_404(Poll, pk=poll_id)
        serializer = PollOptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        option = PollOption.objects.create(
            poll=poll,
            text=serializer.validated_data["text"],
            created_by=request.user,
        )
        return Response({"option": PollOptionSerializer(option).data})


class PollAnswerCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, poll_id: str):
        poll = get_object_or_404(Poll, pk=poll_id)
        serializer = PollAnswerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answer = PollAnswer.objects.create(
            poll=poll,
            text=serializer.validated_data["text"],
            user=request.user,
        )
        return Response({"answer": PollAnswerSerializer(answer).data})


class PollVoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, poll_id: str, option_id: str):
        poll = get_object_or_404(Poll, pk=poll_id)
        option = get_object_or_404(PollOption, pk=option_id, poll=poll)

        try:
            limit = _parse_limit(request.query_params.get("limit"))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        cursor_param = request.query_params.get("cursor")
        votes_qs = PollVote.objects.filter(poll=poll, option=option).order_by(
            "-created_at", "-id"
        )
        if cursor_param:
            try:
                cursor = Cursor.decode(cursor_param)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            votes_qs = votes_qs.filter(cursor.as_filters())

        votes = list(votes_qs[: limit + 1])
        has_next = len(votes) > limit
        page = votes[:limit]

        next_cursor = None
        if has_next and page:
            last = page[-1]
            next_cursor = Cursor(
                created_at=last.created_at,
                identifier=last.id,
            ).encode()

        response = {
            "results": PollVoteListSerializer(page, many=True).data,
            "count": PollVote.objects.filter(poll=poll, option=option).count(),
            "next": next_cursor,
        }
        return Response(response)

    def post(self, request, poll_id: str, option_id: str):
        poll = get_object_or_404(Poll, pk=poll_id)
        option = get_object_or_404(PollOption, pk=option_id, poll=poll)

        with transaction.atomic():
            vote, created = PollVote.objects.select_for_update().get_or_create(
                poll=poll,
                user=request.user,
                defaults={"option": option},
            )

            event_type = "poll.vote_casted"
            from_option_id: Optional[str] = None

            if not created:
                if vote.option_id == option.id:
                    payload = _vote_response_payload(poll, option, request.user.id, vote)
                    return Response(payload)
                from_option_id = str(vote.option_id)
                vote.option = option
                vote.save(update_fields=["option", "updated_at"])
                event_type = "poll.vote_changed"

        payload = _vote_response_payload(
            poll,
            option,
            request.user.id,
            vote,
            from_option_id=from_option_id,
        )
        _broadcast_vote_event(poll, event_type, vote, from_option_id=from_option_id)
        return Response(payload)


    def delete(self, request, poll_id: str, option_id: str):
        poll = get_object_or_404(Poll, pk=poll_id)
        option = get_object_or_404(PollOption, pk=option_id, poll=poll)

        try:
            vote = PollVote.objects.get(poll=poll, user=request.user)
        except PollVote.DoesNotExist:
            payload = {
                "status": "ok",
                "poll_id": str(poll.id),
                "option_id": str(option.id),
                "user_id": str(request.user.id),
                "poll_vote": None,
            }
            return Response(payload)

        removed_option_id = str(vote.option_id)
        vote_payload = serialize_vote(vote)
        vote.delete()

        payload = {
            "status": "ok",
            "poll_id": str(poll.id),
            "option_id": str(option.id),
            "user_id": str(request.user.id),
            "poll_vote": vote_payload,
        }
        _broadcast_vote_event(
            poll,
            "poll.vote_removed",
            vote,
            removed_option_id=removed_option_id,
        )
        return Response(payload)


def _vote_response_payload(
    poll: Poll,
    option: PollOption,
    user_id: int | str,
    vote: PollVote,
    *,
    from_option_id: Optional[str] = None,
) -> dict:
    payload = {
        "status": "ok",
        "poll_id": str(poll.id),
        "option_id": str(option.id),
        "user_id": str(user_id),
        "poll_vote": serialize_vote(vote),
    }
    if from_option_id:
        payload["from_option_id"] = from_option_id
    return payload


def _broadcast_vote_event(
    poll: Poll,
    event_type: str,
    vote: PollVote,
    *,
    from_option_id: Optional[str] = None,
    removed_option_id: Optional[str] = None,
) -> None:
    vote_data = serialize_vote(vote)
    payload = {
        "type": event_type,
        "event": event_type,
        "event_type": event_type,
        "cid": poll.cid,
        "poll_id": str(poll.id),
        "user_id": str(vote.user_id),
        "ts": current_timestamp(),
        "poll_vote": vote_data,
    }
    if event_type == "poll.vote_casted":
        payload["option_id"] = str(vote.option_id)
    if event_type == "poll.vote_changed":
        payload["from_option_id"] = from_option_id
        payload["to_option_id"] = str(vote.option_id)
    if event_type == "poll.vote_removed":
        payload["option_id"] = removed_option_id or str(vote.option_id)
    _broadcast_poll_event(poll, payload)
