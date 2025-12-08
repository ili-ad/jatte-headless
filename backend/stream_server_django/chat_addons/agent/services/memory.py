"""Persistence helpers for lightweight agent memory."""
from __future__ import annotations

from django.db import transaction

from ..config import MEMORY_MAX_LINES
from ..models import AgentMemoryEntry

_ALLOWED_ROLES = {
    AgentMemoryEntry.ROLE_HUMAN,
    AgentMemoryEntry.ROLE_AGENT,
    AgentMemoryEntry.ROLE_SYSTEM,
}


def _normalise_max_lines(value: int | None) -> int:
    if value is None:
        return MEMORY_MAX_LINES
    try:
        coerced = int(value)
    except (TypeError, ValueError):  # pragma: no cover - defensive
        coerced = MEMORY_MAX_LINES
    if coerced < 60:
        return 60
    if coerced > 100:
        return 100
    return coerced


class MemoryService:
    """CRUD facade around ``AgentMemoryEntry`` records."""

    def __init__(self, *, max_lines: int | None = None) -> None:
        self._max_lines = _normalise_max_lines(max_lines)

    @property
    def max_lines(self) -> int:
        return self._max_lines

    def add_line(self, *, cid: str, role: str, text: str) -> None:
        if role not in _ALLOWED_ROLES:
            raise ValueError(f"Unsupported role: {role}")
        if not isinstance(text, str):  # pragma: no cover - guard rails
            text = str(text)

        with transaction.atomic():
            AgentMemoryEntry.objects.create(cid=cid, role=role, text=text)

            ids_to_keep = list(
                AgentMemoryEntry.objects.filter(cid=cid)
                .order_by("-created_at", "-id")
                .values_list("id", flat=True)[: self._max_lines]
            )
            if ids_to_keep:
                AgentMemoryEntry.objects.filter(cid=cid).exclude(id__in=ids_to_keep).delete()

    def recall(self, *, cid: str, query: str, k: int = 3) -> list[dict]:
        try:
            limit = max(1, int(k))
        except (TypeError, ValueError):  # pragma: no cover - guard rails
            limit = 3

        entries = list(
            AgentMemoryEntry.objects.filter(cid=cid).order_by("-created_at", "-id")
        )

        normalized_query = (query or "").strip().lower()
        tokens = [token for token in normalized_query.split() if token]

        scored: list[tuple[int, AgentMemoryEntry]] = []
        total = len(entries)
        for index, entry in enumerate(entries):
            recency_score = total - index
            keyword_score = 0
            if normalized_query:
                text_lower = entry.text.lower()
                if normalized_query in text_lower:
                    keyword_score += 10
                if tokens:
                    keyword_score += sum(1 for token in tokens if token in text_lower)
            score = keyword_score * 1000 + recency_score
            scored.append((score, entry))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        top_entries = [entry for _, entry in scored[:limit]]

        return [
            {
                "text": entry.text,
                "role": entry.role,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in top_entries
        ]

    def list_memory(
        self, *, cid: str, limit: int = 20, cursor: str | None = None
    ) -> dict:
        try:
            page_size = max(1, min(100, int(limit)))
        except (TypeError, ValueError):  # pragma: no cover - guard rails
            page_size = 20

        queryset = AgentMemoryEntry.objects.filter(cid=cid).order_by("-id")

        if cursor:
            try:
                last_id = int(cursor)
            except (TypeError, ValueError):  # pragma: no cover - guard rails
                last_id = None
            if last_id is not None:
                queryset = queryset.filter(id__lt=last_id)

        entries = list(queryset[: page_size + 1])
        has_next = len(entries) > page_size
        rows = entries[:page_size] if has_next else entries

        next_cursor = str(rows[-1].id) if has_next and rows else None

        results = [
            {
                "text": entry.text,
                "role": entry.role,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in rows
        ]

        return {"results": results, "next": next_cursor}
