"""REST endpoints powering the shim's room bootstrap flow."""

from __future__ import annotations

from typing import Iterable

import zlib
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.chat.mixins import RoomFromCIDMixin
from stream_server_django.chat.models import Room

from .serializers import RoomListSerializer

User = get_user_model()

_DEFAULT_LIMIT = 50
_MAX_LIMIT = 100
_room_resolver = RoomFromCIDMixin()


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def list_rooms(request: Request) -> Response:
    """Return every room with the minimal shape expected by the shim."""

    rooms = Room.objects.all()
    serializer = RoomListSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def list_active_rooms(request: Request) -> Response:
    """Return only rooms marked as active."""

    rooms = Room.objects.filter(status=Room.ACTIVE)
    serializer = RoomListSerializer(rooms, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def list_room_members_cid(request: Request, cid: str) -> Response:
    """Return a paginated member payload for the given channel identifier."""

    limit, offset = _parse_pagination(request.query_params)
    room = _room_resolver.get_room(cid)
    members = _collect_members(room)
    page = members[offset : offset + limit if limit else None]
    return Response({"members": page})


def _parse_pagination(params) -> tuple[int, int]:
    """Extract and validate pagination parameters from the request."""

    limit_param = params.get("limit", _DEFAULT_LIMIT)
    offset_param = params.get("offset", 0)

    try:
        limit = int(limit_param)
        offset = int(offset_param)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
        raise ValidationError({"detail": "Invalid pagination"}) from exc

    if limit < 0 or offset < 0:
        raise ValidationError({"detail": "Invalid pagination"})

    limit = min(limit, _MAX_LIMIT)
    return limit, offset


def _collect_members(room: Room) -> list[dict[str, object]]:
    """Mirror the member aggregation used by Stream's REST API."""

    identifiers = {
        value for value in room.messages.values_list("sent_by", flat=True) if value
    }

    if room.client:
        identifiers.add(room.client)

    identifier_map = _build_identifier_map(identifiers)

    members: list[dict[str, object]] = []
    seen: set[tuple[int, str | None]] = set()

    if room.agent_id:
        _append_member(members, seen, room.agent_id, role="agent")
        agent_identifier_candidates: Iterable[str] = filter(
            None,
            {
                getattr(room.agent, "username", None),
                getattr(room.agent, "supabase_uid", None),
            },
        )
        for candidate in agent_identifier_candidates:
            identifier_map.setdefault(candidate, room.agent_id)

    client_id, client_user = _resolve_identifier(room.client, identifier_map)
    if client_id is not None:
        _append_member(
            members,
            seen,
            client_id,
            role="member",
            user=client_user,
        )

    for identifier in sorted(identifiers):
        user_id, user_payload = _resolve_identifier(identifier, identifier_map)
        if user_id is not None:
            _append_member(
                members,
                seen,
                user_id,
                role="member",
                user=user_payload,
            )

    return members


def _build_identifier_map(identifiers: set[str]) -> dict[str, int]:
    """Resolve message-sender identifiers back to primary keys."""

    if not identifiers:
        return {}

    query = Q(username__in=identifiers) | Q(supabase_uid__in=identifiers)
    mapping: dict[str, int] = {}
    for user in User.objects.filter(query):
        if user.username:
            mapping.setdefault(user.username, user.id)
        supabase_uid = getattr(user, "supabase_uid", None)
        if supabase_uid:
            mapping.setdefault(supabase_uid, user.id)
    return mapping


def _resolve_identifier(
    identifier, mapping: dict[str, int]
) -> tuple[int | None, dict[str, str] | None]:
    """Convert message identifiers to deterministic member payloads."""

    if not identifier:
        return None, None

    user_id = mapping.get(identifier)
    if user_id is not None:
        return user_id, None

    try:
        return int(identifier), None
    except (TypeError, ValueError):
        hashed_id = zlib.crc32(str(identifier).encode("utf-8")) & 0xFFFFFFFF
        if hashed_id == 0:
            hashed_id = 1
        return hashed_id, {"id": str(identifier)}


def _append_member(
    members: list[dict[str, object]],
    seen: set[tuple[int, str | None]],
    user_id: int,
    *,
    role: str,
    user: dict[str, str] | None = None,
) -> None:
    """Append a member payload while avoiding duplicates."""

    payload_id = user.get("id") if user else None
    key = (user_id, payload_id)
    if key in seen:
        return
    seen.add(key)
    payload: dict[str, object] = {"user_id": user_id, "role": role, "banned": False}
    if user:
        payload["user"] = user
    members.append(payload)
