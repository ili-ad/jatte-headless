"""Pluggable extension hooks for agent RAG and sidecars."""
from __future__ import annotations

import logging
from typing import Callable, List, Optional

from django.utils.module_loading import import_string

from .config import AGENT_RAG_PROMPT_BUILDER, AGENT_SIDECAR_DEFS_PROVIDER
from .sidecar_catalog import SidecarItemDef


logger = logging.getLogger("agent")


def _load_hook(path: str) -> Optional[Callable[..., object]]:
    try:
        return import_string(path)
    except Exception:
        logger.exception("agent.extensions.load_failed", extra={"path": path})
        return None


def get_sidecar_defs(meta: dict) -> List[SidecarItemDef]:
    """
    Return sidecar item definitions supplied by a host application.

    The provider function should accept a meta dict and return a list of
    SidecarItemDef entries. When no provider is configured, returns [].
    """
    if not AGENT_SIDECAR_DEFS_PROVIDER:
        return []

    provider = _load_hook(AGENT_SIDECAR_DEFS_PROVIDER)
    if not provider:
        return []

    try:
        result = provider(meta)
    except Exception:
        logger.exception(
            "agent.extensions.sidecar_defs_failed",
            extra={"path": AGENT_SIDECAR_DEFS_PROVIDER},
        )
        return []

    return list(result) if result else []


def build_rag_system_prompt(
    *,
    question: str,
    context_block: str,
    meta: dict,
    state: str | None,
    topic: str | None,
) -> str:
    """
    Build the system prompt for RAG responses.

    The hook receives the user question, context excerpts, metadata, and
    optional state/topic hints. The default implementation is domain-neutral.
    """
    if AGENT_RAG_PROMPT_BUILDER:
        builder = _load_hook(AGENT_RAG_PROMPT_BUILDER)
        if builder:
            try:
                return str(
                    builder(
                        question=question,
                        context_block=context_block,
                        meta=meta,
                        state=state,
                        topic=topic,
                    )
                )
            except Exception:
                logger.exception(
                    "agent.extensions.rag_prompt_failed",
                    extra={"path": AGENT_RAG_PROMPT_BUILDER},
                )

    return (
        "You are a helpful assistant. Use the provided context excerpts as the primary "
        "source for your answer. If the context does not address the question, say so "
        "and answer based on general knowledge. Keep the response concise, clear, and "
        "actionable.\n\n"
        "=== CONTEXT START ===\n"
        f"{context_block}\n"
        "=== CONTEXT END ==="
    )
