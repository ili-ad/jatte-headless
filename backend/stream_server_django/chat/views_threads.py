from __future__ import annotations

from typing import Any

from django.db.models import Count, Max, OuterRef, Subquery
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication

from .api_views import _message_from_identifier, _user_can_access_room
from .models import Message, Room
from .serializers import MessageSerializer, ThreadPreviewSerializer


class ThreadListView(APIView):
    """Return paginated thread previews for a room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    default_limit = 30
    max_limit = 100

    def get(self, request, *args: Any, **kwargs: Any):
        cid_param = request.query_params.get("cid")
        if not cid_param:
            raise ValidationError({"cid": "This query parameter is required."})

        if ":" in cid_param:
            _, room_uuid = cid_param.split(":", 1)
            cid = cid_param
        else:
            room_uuid = cid_param
            cid = f"messaging:{room_uuid}"

        room = get_object_or_404(Room, uuid=room_uuid)
        if not _user_can_access_room(request.user, room):
            raise PermissionDenied()

        limit = self._parse_limit(request.query_params.get("limit", self.default_limit))
        cursor_param = request.query_params.get("cursor")

        queryset = (
            room.messages.filter(replies__isnull=False)
            .distinct()
            .annotate(
                reply_count=Count("replies", distinct=True),
                last_reply_at=Max("replies__created_at"),
                last_reply_id=Subquery(
                    Message.objects.filter(reply_to=OuterRef("pk"))
                    .order_by("-created_at", "-id")
                    .values("id")[:1]
                ),
            )
            .order_by("-last_reply_at", "-id")
        )

        if cursor_param:
            try:
                cursor_id = int(cursor_param)
            except (TypeError, ValueError) as exc:
                raise ValidationError({"cursor": "Invalid cursor."}) from exc
            queryset = queryset.filter(id__lt=cursor_id)

        records = list(queryset[: limit + 1])
        has_more = len(records) > limit
        page = records[:limit]

        reply_ids = [getattr(item, "last_reply_id", None) for item in page]
        reply_map = {
            reply.id: reply
            for reply in Message.objects.filter(id__in=[r for r in reply_ids if r])
        }

        serializer = ThreadPreviewSerializer(
            page,
            many=True,
            context={"cid": cid, "replies_map": reply_map},
        )

        next_cursor = str(page[-1].id) if has_more and page else None
        return Response({"results": serializer.data, "next": next_cursor})

    def _parse_limit(self, raw_limit: Any) -> int:
        try:
            limit = int(raw_limit)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"limit": "Invalid limit."}) from exc
        limit = max(1, min(limit, self.max_limit))
        return limit


class MessageRepliesView(APIView):
    """Return paginated replies for the given parent message."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    default_limit = 30
    max_limit = 100

    def get(self, request, message_id: str, *args: Any, **kwargs: Any):
        parent = _message_from_identifier(message_id)
        room = Room.objects.filter(uuid=parent.channel.uuid).first()
        if room is None or not room.messages.filter(pk=parent.pk).exists():
            raise Http404
        if not _user_can_access_room(request.user, room):
            raise PermissionDenied()

        limit = self._parse_limit(request.query_params.get("limit", self.default_limit))
        before_param = request.query_params.get("before")

        queryset = parent.replies.order_by("-id")
        if before_param:
            try:
                before_id = int(before_param)
            except (TypeError, ValueError) as exc:
                raise ValidationError({"before": "Invalid cursor."}) from exc
            queryset = queryset.filter(id__lt=before_id)

        records = list(queryset[: limit + 1])
        has_more = len(records) > limit
        page = records[:limit]

        serializer = MessageSerializer(page, many=True)
        next_cursor = str(page[-1].id) if has_more and page else None

        return Response({"messages": serializer.data, "next": next_cursor})

    def _parse_limit(self, raw_limit: Any) -> int:
        try:
            limit = int(raw_limit)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"limit": "Invalid limit."}) from exc
        limit = max(1, min(limit, self.max_limit))
        return limit
