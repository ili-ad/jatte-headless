"""Iliad-specific RAG prompt stub."""
from __future__ import annotations


def build_rag_system_prompt_iliad(
    *,
    question: str,
    context_block: str,
    meta: dict,
    state: str | None,
    topic: str | None,
) -> str:
    """Return a neutral, luxury-friendly RAG prompt."""
    _ = meta, state, topic
    return (
        "You are a knowledgeable concierge for Iliad. Use the provided context "
        "excerpts as the primary source. If the context does not answer the question, "
        "say so and answer based on general knowledge. Keep the tone polished, concise, "
        "and helpful.\n\n"
        f"User question: {question}\n\n"
        "=== CONTEXT START ===\n"
        f"{context_block}\n"
        "=== CONTEXT END ==="
    )
