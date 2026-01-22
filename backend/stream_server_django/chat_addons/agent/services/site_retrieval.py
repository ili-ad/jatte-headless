from __future__ import annotations

import logging
from typing import Optional, Sequence, TypedDict

from django.db.models import QuerySet

from stream_server_django.chat_addons.agent.models import DocumentChunk
from stream_server_django.chat_addons.agent import config as agent_config
from stream_server_django.chat_addons.agent.services.vector_memory import (
    CosineDistance,
    PGVECTOR_ENABLED,
    embed_query,
)

logger = logging.getLogger(__name__)


class SiteChunkResult(TypedDict):
    canonical_path: str
    title: str
    snippet: str
    score: float
    chunk_id: int
    meta: dict


def _build_queryset(
    *,
    state: str,
    topics: Optional[Sequence[str]],
    page_kinds: Optional[Sequence[str]],
    paths: Optional[Sequence[str]],
) -> QuerySet[DocumentChunk]:
    qs = DocumentChunk.objects.filter(state=state)
    if topics:
        qs = qs.filter(topic__in=topics)
    if page_kinds:
        qs = qs.filter(metadata__page_kind__in=page_kinds)
    if paths:
        qs = qs.filter(metadata__canonical_path__in=paths)
    return qs


def _build_snippet(heading: str, text: str) -> str:
    heading = heading.strip()
    text = text.strip()
    if heading:
        return f"{heading}\n{text[:280].strip()}"
    return text[:300].strip()


def _query_chunks(
    qs: QuerySet[DocumentChunk],
    *,
    query_embedding: Sequence[float],
    k: int,
) -> list[DocumentChunk]:
    distance_expr = CosineDistance("embedding", list(query_embedding))
    return list(qs.annotate(distance=distance_expr).order_by("distance")[:k])


def _normalize_chunk(chunk: DocumentChunk) -> SiteChunkResult:
    metadata = chunk.metadata or {}
    distance = float(getattr(chunk, "distance", 0.0))
    return {
        "canonical_path": metadata.get("canonical_path", ""),
        "title": metadata.get("title", ""),
        "snippet": _build_snippet(chunk.heading or "", chunk.text or ""),
        "score": 1.0 - distance,
        "chunk_id": chunk.id,
        "meta": {
            "topic": chunk.topic,
            "page_kind": metadata.get("page_kind"),
            "locale": metadata.get("locale"),
        },
    }


def _extract_locale(metadata: dict | None) -> Optional[str]:
    if not metadata:
        return None
    locale = metadata.get("locale")
    if isinstance(locale, str):
        locale = locale.strip()
        if locale:
            return locale
    return None


def _resolve_rag_state(requested_state: str | None) -> str:
    normalized = agent_config._normalize_rag_state(requested_state)
    if normalized == "ILPRIV" and not agent_config.AGENT_RAG_ALLOW_PRIVATE_DEFAULT:
        logger.warning(
            "agent.rag.state.private_not_allowed",
            extra={"raw": requested_state, "coerced": "ILPUB"},
        )
        return "ILPUB"
    return normalized


def site_retrieve(
    *,
    query: str,
    state: str | None = "ILPUB",
    k: int = 5,
    locale: Optional[str] = None,
    topics: Optional[Sequence[str]] = None,
    page_kinds: Optional[Sequence[str]] = None,
    paths: Optional[Sequence[str]] = None,
) -> list[SiteChunkResult]:
    if not PGVECTOR_ENABLED:
        return []

    resolved_state = _resolve_rag_state(state)
    query_embedding = embed_query(query)
    base_qs = _build_queryset(
        state=resolved_state,
        topics=topics,
        page_kinds=page_kinds,
        paths=paths,
    )

    if locale:
        locale_qs = base_qs.filter(metadata__locale=locale)
        locale_results = _query_chunks(locale_qs, query_embedding=query_embedding, k=k)
        if locale_results:
            return [_normalize_chunk(chunk) for chunk in locale_results]
        fallback_top = _query_chunks(base_qs, query_embedding=query_embedding, k=1)
        fallback_locale = _extract_locale(
            fallback_top[0].metadata if fallback_top else None
        )
        if fallback_locale:
            fallback_qs = base_qs.filter(metadata__locale=fallback_locale)
            fallback_results = _query_chunks(
                fallback_qs, query_embedding=query_embedding, k=k
            )
            if fallback_results:
                return [_normalize_chunk(chunk) for chunk in fallback_results]

    results = _query_chunks(base_qs, query_embedding=query_embedding, k=k)
    return [_normalize_chunk(chunk) for chunk in results]
