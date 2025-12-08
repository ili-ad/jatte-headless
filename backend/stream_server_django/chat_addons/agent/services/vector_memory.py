# chat_addons/agent/services/vector_memory.py

from __future__ import annotations

from typing import List, Sequence

from django.conf import settings
from django.db.models.expressions import RawSQL

from openai import OpenAI
from pgvector import Vector
from pgvector.django import CosineDistance #Vector

from stream_server_django.chat_addons.agent.models import DocumentChunk




def search_similar(
    *,
    state: str,
    query_embedding: Sequence[float],
    k: int = 5,
    topic: str | None = None,
) -> List[DocumentChunk]:
    """
    Return the top-k DocumentChunk rows most similar to `query_embedding`
    using pgvector cosine distance.
    """
    qs = DocumentChunk.objects.filter(state=state)
    if topic:
        qs = qs.filter(topic=topic)

    # pgvector.django's CosineDistance builds a proper ORM expression that
    # knows how to adapt a Python list[float] to the VectorField.
    distance_expr = CosineDistance("embedding", list(query_embedding))
    return list(qs.order_by(distance_expr)[:k])


# def search_similar(
#     *,
#     state: str,
#     query_embedding: Sequence[float],
#     k: int = 5,
#     topic: str | None = None,
# ) -> List[DocumentChunk]:
#     """
#     Return the top-k DocumentChunk rows most similar to `query_embedding`
#     using pgvector cosine distance.

#     - `state` lets us scope by jurisdiction (e.g. "FL").
#     - `topic` (optional) lets us narrow to a specific pillar
#       (e.g. "noc_compliance", "lien_waiver_caselaw").
#     """

#     qs = DocumentChunk.objects.filter(state=state)
#     if topic:
#         qs = qs.filter(topic=topic)

#     # pgvector uses the <#> operator for cosine distance.
#     # The Vector(...) wrapper ensures psycopg2 knows how to adapt the value.
#     vec = Vector(query_embedding)
#     ordering = RawSQL("embedding <#> %s", [vec])

#     # Smaller distance = more similar, so we order ascending
#     chunks = list(qs.order_by(ordering)[:k])
#     return chunks


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY must be set for embeddings")
        _client = OpenAI(api_key=api_key)
    return _client


def embed_query(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """
    Embed a single query string into the same vector space as DocumentChunk.embedding.
    """
    client = _get_client()
    resp = client.embeddings.create(model=model, input=[text])
    return resp.data[0].embedding


