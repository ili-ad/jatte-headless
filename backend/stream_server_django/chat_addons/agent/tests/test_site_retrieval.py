from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest import mock

BASE_DIR = Path(__file__).resolve().parents[5]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")

import django

django.setup()

import pytest

from django.db import connection

from stream_server_django.chat_addons.agent.models import DocumentChunk
from stream_server_django.chat_addons.agent.services.site_retrieval import (
    site_retrieve,
)
from stream_server_django.chat_addons.agent.services.vector_memory import (
    PGVECTOR_ENABLED,
)

pytestmark = pytest.mark.skipif(
    not PGVECTOR_ENABLED, reason="pgvector is not installed"
)


@pytest.fixture(autouse=True)
def _require_postgres() -> None:
    if connection.vendor != "postgresql":
        pytest.skip("requires postgres with pgvector")


def _fake_embedding(value: float = 0.1) -> list[float]:
    return [value] * 1536


def _create_chunk(
    *,
    state: str,
    topic: str,
    doc_name: str,
    chunk_index: int,
    heading: str,
    text: str,
    metadata: dict,
    embedding_value: float,
) -> DocumentChunk:
    return DocumentChunk.objects.create(
        state=state,
        topic=topic,
        doc_name=doc_name,
        chunk_index=chunk_index,
        heading=heading,
        text=text,
        metadata=metadata,
        embedding=_fake_embedding(embedding_value),
    )


def test_site_retrieve_filters_by_topics(db) -> None:
    _create_chunk(
        state="ILPUB",
        topic="alpha",
        doc_name="doc-alpha",
        chunk_index=0,
        heading="Alpha heading",
        text="Alpha text",
        metadata={"canonical_path": "/alpha", "page_kind": "policy"},
        embedding_value=0.1,
    )
    _create_chunk(
        state="ILPUB",
        topic="beta",
        doc_name="doc-beta",
        chunk_index=0,
        heading="Beta heading",
        text="Beta text",
        metadata={"canonical_path": "/beta", "page_kind": "faq"},
        embedding_value=0.2,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(),
    ):
        results = site_retrieve(
            query="test",
            topics=["alpha"],
            k=5,
        )

    assert results
    assert {item["meta"]["topic"] for item in results} == {"alpha"}


def test_site_retrieve_filters_by_page_kinds(db) -> None:
    _create_chunk(
        state="ILPUB",
        topic="policy",
        doc_name="doc-policy",
        chunk_index=0,
        heading="Policy heading",
        text="Policy text",
        metadata={"canonical_path": "/policy", "page_kind": "policy"},
        embedding_value=0.1,
    )
    _create_chunk(
        state="ILPUB",
        topic="faq",
        doc_name="doc-faq",
        chunk_index=0,
        heading="FAQ heading",
        text="FAQ text",
        metadata={"canonical_path": "/faq", "page_kind": "faq"},
        embedding_value=0.2,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(),
    ):
        results = site_retrieve(
            query="test",
            page_kinds=["policy"],
            k=5,
        )

    assert results
    assert {item["meta"]["page_kind"] for item in results} == {"policy"}


def test_site_retrieve_filters_by_paths(db) -> None:
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-a",
        chunk_index=0,
        heading="Doc A heading",
        text="Doc A text",
        metadata={"canonical_path": "/a", "page_kind": "policy"},
        embedding_value=0.1,
    )
    _create_chunk(
        state="ILPUB",
        topic="topic-b",
        doc_name="doc-b",
        chunk_index=0,
        heading="Doc B heading",
        text="Doc B text",
        metadata={"canonical_path": "/b", "page_kind": "policy"},
        embedding_value=0.2,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(),
    ):
        results = site_retrieve(
            query="test",
            paths=["/a"],
            k=5,
        )

    assert results
    assert {item["canonical_path"] for item in results} == {"/a"}


def test_site_retrieve_prefers_locale_without_mixing(db) -> None:
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-en",
        chunk_index=0,
        heading="EN heading",
        text="EN text",
        metadata={
            "canonical_path": "/en",
            "page_kind": "policy",
            "locale": "en",
        },
        embedding_value=0.1,
    )
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-es",
        chunk_index=0,
        heading="ES heading",
        text="ES text",
        metadata={
            "canonical_path": "/es",
            "page_kind": "policy",
            "locale": "es",
        },
        embedding_value=0.2,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(),
    ):
        results = site_retrieve(
            query="test",
            locale="en",
            k=5,
        )

    assert results
    assert len(results) == 1
    assert {item["meta"]["locale"] for item in results} == {"en"}


def test_site_retrieve_falls_back_when_locale_missing(db) -> None:
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-es",
        chunk_index=0,
        heading="ES heading",
        text="ES text",
        metadata={
            "canonical_path": "/es",
            "page_kind": "policy",
            "locale": "es",
        },
        embedding_value=0.1,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(),
    ):
        results = site_retrieve(
            query="test",
            locale="en",
            k=5,
        )

    assert results
    assert {item["meta"]["locale"] for item in results} == {"es"}


def test_site_retrieve_falls_back_to_single_locale_when_requested_locale_missing(
    db,
) -> None:
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-en",
        chunk_index=0,
        heading="EN heading",
        text="EN text",
        metadata={
            "canonical_path": "/en",
            "page_kind": "policy",
            "locale": "en",
        },
        embedding_value=0.1,
    )
    _create_chunk(
        state="ILPUB",
        topic="topic-a",
        doc_name="doc-es",
        chunk_index=0,
        heading="ES heading",
        text="ES text",
        metadata={
            "canonical_path": "/es",
            "page_kind": "policy",
            "locale": "es",
        },
        embedding_value=-0.1,
    )

    with mock.patch(
        "stream_server_django.chat_addons.agent.services.site_retrieval.embed_query",
        return_value=_fake_embedding(0.1),
    ):
        results = site_retrieve(
            query="test",
            locale="fr",
            k=5,
        )

    assert results
    assert {item["meta"]["locale"] for item in results} == {"en"}
