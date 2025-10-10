from __future__ import annotations

from typing import Iterable

import zlib

from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import (
    DevTokenOrJWTAuthentication,
    SupabaseJWTAuthentication,
)

from .mixins import RoomFromCIDMixin
from .serializers import RoomMemberOut

User = get_user_model()


class TokenView(APIView):
    """Return a signed chat token for the authenticated Supabase user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the current user's ID and their Supabase access token."""

        return Response({
            "userID": request.user.id,
            "userToken": request.auth,
        })


class RoomMembersCIDView(RoomFromCIDMixin, APIView):
    """Return paginated members for the room identified by ``cid``."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = RoomMemberOut
    default_limit = 50
    max_limit = 100

    def get(self, request, cid: str):
        limit, offset = self._parse_pagination(request.query_params)
        room = self.get_room(cid)
        members = self._collect_members(room)
        page = members[offset : offset + limit if limit else None]
        serializer = self.serializer_class(page, many=True)
        return Response({"members": serializer.data})

    def _parse_pagination(self, params) -> tuple[int, int]:
        limit_param = params.get("limit", self.default_limit)
        offset_param = params.get("offset", 0)

        try:
            limit = int(limit_param)
            offset = int(offset_param)
        except (TypeError, ValueError):
            raise ValidationError({"detail": "Invalid pagination"})

        if limit < 0 or offset < 0:
            raise ValidationError({"detail": "Invalid pagination"})

        limit = min(limit, self.max_limit)
        return limit, offset

    def _collect_members(self, room) -> list[dict[str, object]]:
        identifiers = {
            value
            for value in room.messages.values_list("sent_by", flat=True)
            if value
        }

        if room.client:
            identifiers.add(room.client)

        identifier_map = self._build_identifier_map(identifiers)

        members: list[dict[str, object]] = []
        seen: set[tuple[int, str | None]] = set()

        if room.agent_id:
            self._append_member(members, seen, room.agent_id, role="agent")

            agent_identifier_candidates: Iterable[str] = filter(
                None,
                {
                    getattr(room.agent, "username", None),
                    getattr(room.agent, "supabase_uid", None),
                },
            )
            for candidate in agent_identifier_candidates:
                identifier_map.setdefault(candidate, room.agent_id)

        client_id, client_user = self._resolve_identifier(room.client, identifier_map)
        if client_id is not None:
            self._append_member(
                members,
                seen,
                client_id,
                role="member",
                user=client_user,
            )

        for identifier in sorted(identifiers):
            user_id, user_payload = self._resolve_identifier(identifier, identifier_map)
            if user_id is not None:
                self._append_member(
                    members,
                    seen,
                    user_id,
                    role="member",
                    user=user_payload,
                )

        return members

    def _build_identifier_map(self, identifiers: set[str]) -> dict[str, int]:
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
        self, identifier, mapping: dict[str, int]
    ) -> tuple[int | None, dict[str, str] | None]:
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
        self,
        members: list[dict[str, object]],
        seen: set[tuple[int, str | None]],
        user_id: int,
        *,
        role: str,
        user: dict[str, str] | None = None,
    ) -> None:
        key = (user_id, user.get("id") if user else None)
        if key in seen:
            return
        seen.add(key)
        payload = {"user_id": user_id, "role": role, "banned": False}
        if user:
            payload["user"] = user
        members.append(payload)


try:  # pragma: no cover - defensive reassignment for legacy imports
    from . import api_views as _api_views  # type: ignore
except ImportError:  # pragma: no cover - module not available during certain tests
    _api_views = None
else:  # pragma: no cover - mutation to maintain old import paths
    _api_views.RoomMembersCIDView = RoomMembersCIDView

