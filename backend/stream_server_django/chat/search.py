"""Helpers for running message full-text searches."""

from __future__ import annotations

import base64
import binascii
import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from typing import Sequence

from django.db import OperationalError, connection
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import Message
from .utils import canonical_cid

logger = logging.getLogger(__name__)

STATEMENT_TIMEOUT_MS = 200
CURSOR_VERSION = 1
CURSOR_PREFIX = "search:v1"


class SearchTimeoutError(RuntimeError):
    """Raised when the underlying database search times out."""


@dataclass(slots=True)
class SearchCursor:
    """Cursor metadata for stable pagination ordering."""

    rank: float | None = None
    created_at: datetime | None = None
    message_id: int | None = None


_TS_CLEAN_RE = re.compile(r"[^0-9A-Za-z]+")


def _tokenize_query(value: str) -> tuple[list[str], int | None]:
    raw_tokens = [token for token in value.split() if token]
    tokens: list[str] = []
    numeric_term: int | None = None

    for token in raw_tokens:
        cleaned = _TS_CLEAN_RE.sub("", token)
        if not cleaned:
            continue
        if cleaned.isdigit():
            if numeric_term is None:
                try:
                    numeric_term = int(cleaned)
                except ValueError:
                    numeric_term = None
            continue
        tokens.append(cleaned.lower())

    return tokens, numeric_term


def _normalize_query(value: str) -> tuple[str | None, int | None, list[str]]:
    tokens, numeric_term = _tokenize_query(value)
    ts_terms = [f"{token}:*" for token in tokens]
    ts_query = " & ".join(ts_terms) if ts_terms else None
    return ts_query, numeric_term, tokens


def _encode_cursor(rank: float, created_at: datetime, message_id: int) -> str:
    created_at = _ensure_aware(created_at)
    payload = {
        "v": CURSOR_VERSION,
        "t": CURSOR_PREFIX,
        "rank": rank,
        "created_at": created_at.isoformat(),
        "id": message_id,
    }
    data = json.dumps(payload, separators=(",", ":"))
    return base64.urlsafe_b64encode(data.encode("utf-8")).decode("ascii")


def _decode_cursor(raw: str) -> SearchCursor:
    if not raw:
        return SearchCursor()

    try:
        decoded = base64.urlsafe_b64decode(raw.encode("ascii"))
        payload = json.loads(decoded.decode("utf-8"))
        if payload.get("t") == CURSOR_PREFIX and payload.get("v") == CURSOR_VERSION:
            created = _parse_datetime(payload.get("created_at"))
            rank_val = payload.get("rank")
            rank = float(rank_val) if rank_val is not None else None
            message_id = payload.get("id")
            mid = int(message_id) if message_id is not None else None
            return SearchCursor(rank=rank, created_at=created, message_id=mid)
    except (ValueError, json.JSONDecodeError, binascii.Error):
        pass

    parsed_dt = _parse_datetime(raw)
    if parsed_dt:
        return SearchCursor(created_at=parsed_dt)

    try:
        return SearchCursor(message_id=int(raw))
    except ValueError:
        raise ValueError("Invalid before cursor") from None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = parse_datetime(value)
    if not parsed:
        return None
    return _ensure_aware(parsed)


def _ensure_aware(value: datetime) -> datetime:
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone=dt_timezone.utc)
    return value.astimezone(dt_timezone.utc)


def _format_timestamp(value: datetime) -> str:
    aware = _ensure_aware(value)
    iso = aware.isoformat()
    return iso.replace("+00:00", "Z") if iso.endswith("+00:00") else iso


def _build_uuid_filter(
    *,
    selected_uuid: str | None,
    allowed_uuids: Sequence[str] | None,
) -> tuple[str, list]:
    clauses: list[str] = []
    params: list = []

    if selected_uuid:
        clauses.append("c.uuid = %s")
        params.append(selected_uuid)
    elif allowed_uuids is not None:
        if not allowed_uuids:
            clauses.append("0 = 1")
        else:
            placeholders = ", ".join(["%s"] * len(allowed_uuids))
            clauses.append(f"c.uuid IN ({placeholders})")
            params.extend(allowed_uuids)

    return " AND ".join(clauses), params


def _search_messages_sqlite(
    *,
    tokens: list[str],
    numeric_term: int | None,
    limit: int,
    before: str | None,
    selected_uuid: str | None,
    allowed_channel_uuids: Sequence[str] | None,
) -> tuple[list[dict], str | None]:
    base_qs = Message.objects.select_related("channel")

    if selected_uuid:
        base_qs = base_qs.filter(channel__uuid=selected_uuid)
    elif allowed_channel_uuids is not None:
        if not allowed_channel_uuids:
            return [], None
        base_qs = base_qs.filter(channel__uuid__in=allowed_channel_uuids)

    text_qs = base_qs
    for token in tokens:
        text_qs = text_qs.filter(body__icontains=token)

    results: list[Message] = []
    seen: set[int] = set()

    for message in text_qs.order_by("-created_at", "-id"):
        if message.id in seen:
            continue
        seen.add(message.id)
        results.append(message)

    if numeric_term is not None:
        for message in base_qs.filter(id=numeric_term):
            if message.id in seen:
                continue
            seen.add(message.id)
            results.append(message)

    results.sort(key=lambda msg: (_ensure_aware(msg.created_at), msg.id), reverse=True)

    cursor_filter = SearchCursor()
    if before:
        cursor_filter = _decode_cursor(before)

    def passes_cursor(message: Message) -> bool:
        if cursor_filter.created_at is not None:
            message_created = _ensure_aware(message.created_at)
            if message_created < cursor_filter.created_at:
                return True
            if (
                message_created == cursor_filter.created_at
                and cursor_filter.message_id is not None
            ):
                return message.id < cursor_filter.message_id
            return False
        if cursor_filter.message_id is not None:
            return message.id < cursor_filter.message_id
        return True

    filtered = [message for message in results if passes_cursor(message)]

    has_more = len(filtered) > limit
    sliced = filtered[:limit]

    payload: list[dict] = []
    next_cursor = None

    for message in sliced:
        created_at = _ensure_aware(message.created_at)
        payload.append(
            {
                "id": message.id,
                "text": message.body,
                "user_id": message.sent_by,
                "created_at": _format_timestamp(created_at),
                "cid": canonical_cid(None, room_uuid=str(message.channel.uuid)),
            }
        )

    if has_more and sliced:
        last = sliced[-1]
        next_cursor = _encode_cursor(0.0, _ensure_aware(last.created_at), last.id)

    return payload, next_cursor


def search_messages(
    *,
    query: str,
    limit: int,
    before: str | None = None,
    cid: str | None = None,
    allowed_channel_uuids: Sequence[str] | None = None,
) -> tuple[list[dict], str | None]:
    if limit <= 0:
        raise ValueError("limit must be positive")

    ts_query, numeric_term, tokens = _normalize_query(query)
    if ts_query is None and numeric_term is None and not tokens:
        return [], None

    selected_uuid = None
    if cid:
        canonical = canonical_cid(cid)
        try:
            _, selected_uuid = canonical.split(":", 1)
        except ValueError as exc:
            raise ValueError("Invalid cid") from exc

    uuid_clause, uuid_params = _build_uuid_filter(
        selected_uuid=selected_uuid, allowed_uuids=allowed_channel_uuids
    )

    if connection.vendor != "postgresql":
        return _search_messages_sqlite(
            tokens=tokens,
            numeric_term=numeric_term,
            limit=limit,
            before=before,
            selected_uuid=selected_uuid,
            allowed_channel_uuids=allowed_channel_uuids,
        )

    selects: list[str] = []
    params: list = []

    uuid_filter_sql = f" AND {uuid_clause}" if uuid_clause else ""

    if ts_query is not None:
        selects.append(
            """
            SELECT
                m.id AS message_id,
                m.body,
                m.sent_by,
                m.created_at,
                c.uuid AS channel_uuid,
                ts_rank_cd(
                    to_tsvector('simple', coalesce(m.body, '')),
                    to_tsquery('simple', %s)
                ) AS rank
            FROM chat_message AS m
            INNER JOIN chat_channel AS c ON m.channel_id = c.id
            WHERE to_tsvector('simple', coalesce(m.body, '')) @@ to_tsquery('simple', %s)
            {uuid_filter}
            """.format(uuid_filter=uuid_filter_sql)
        )
        params.extend([ts_query, ts_query, *uuid_params])

    if numeric_term is not None:
        selects.append(
            """
            SELECT
                m.id AS message_id,
                m.body,
                m.sent_by,
                m.created_at,
                c.uuid AS channel_uuid,
                2.0 AS rank
            FROM chat_message AS m
            INNER JOIN chat_channel AS c ON m.channel_id = c.id
            WHERE m.id = %s
            {uuid_filter}
            """.format(uuid_filter=uuid_filter_sql)
        )
        params.extend([numeric_term, *uuid_params])

    if not selects:
        return [], None

    cursor_filter = SearchCursor()
    if before:
        cursor_filter = _decode_cursor(before)

    cursor_sql = ""
    cursor_params: list = []

    if cursor_filter.rank is not None and cursor_filter.created_at and cursor_filter.message_id:
        cursor_sql = (
            "AND (rank < %s OR (rank = %s AND created_at < %s) "
            "OR (rank = %s AND created_at = %s AND message_id < %s))"
        )
        cursor_params.extend(
            [
                cursor_filter.rank,
                cursor_filter.rank,
                cursor_filter.created_at,
                cursor_filter.rank,
                cursor_filter.created_at,
                cursor_filter.message_id,
            ]
        )
    elif cursor_filter.created_at is not None:
        cursor_sql = "AND created_at < %s"
        cursor_params.append(cursor_filter.created_at)
    elif cursor_filter.message_id is not None:
        cursor_sql = "AND message_id < %s"
        cursor_params.append(cursor_filter.message_id)

    final_sql = """
        WITH combined AS (
            {unioned}
        ), deduped AS (
            SELECT DISTINCT ON (message_id)
                message_id,
                body,
                sent_by,
                created_at,
                channel_uuid,
                rank
            FROM combined
            ORDER BY message_id, rank DESC, created_at DESC
        )
        SELECT
            message_id,
            body,
            sent_by,
            created_at,
            channel_uuid,
            rank
        FROM deduped
        WHERE 1=1
        {cursor_clause}
        ORDER BY rank DESC, created_at DESC, message_id DESC
        LIMIT %s
    """.format(
        unioned=" UNION ALL ".join(selects),
        cursor_clause=f" {cursor_sql}" if cursor_sql else "",
    )

    with connection.cursor() as cursor:
        try:
            cursor.execute(
                "SET LOCAL statement_timeout TO %s",
                [f"{STATEMENT_TIMEOUT_MS}ms"],
            )
        except OperationalError:
            # The database may not support statement_timeout (e.g., SQLite tests)
            pass

        try:
            cursor.execute(
                final_sql,
                [*params, *cursor_params, limit + 1],
            )
            rows = cursor.fetchall()
        except OperationalError as exc:  # pragma: no cover - requires timeout triggering
            logger.warning(
                "messages search timed out after %sms", STATEMENT_TIMEOUT_MS, extra={"query": query}
            )
            raise SearchTimeoutError("Search query timed out") from exc

    has_more = len(rows) > limit
    sliced = rows[:limit]

    results: list[dict] = []
    next_cursor = None

    for row in sliced:
        message_id, body, sent_by, created_at, channel_uuid, rank = row
        created_at_dt = _ensure_aware(created_at)
        results.append(
            {
                "id": message_id,
                "text": body,
                "user_id": sent_by,
                "created_at": _format_timestamp(created_at_dt),
                "cid": canonical_cid(None, room_uuid=str(channel_uuid)),
            }
        )

    if has_more and sliced:
        last = sliced[-1]
        _, _, _, created_at, _, rank = last
        next_cursor = _encode_cursor(float(rank), created_at, int(last[0]))

    return results, next_cursor
