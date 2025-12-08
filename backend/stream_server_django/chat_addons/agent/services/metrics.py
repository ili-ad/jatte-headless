from __future__ import annotations

from decimal import Decimal
from typing import Iterable, Mapping, Sequence

__all__ = ["estimate_prompt_tokens", "estimate_total_cost"]


def _count_tokens_from_text(text: str) -> int:
    stripped = text.strip()
    if not stripped:
        return 0
    # Heuristic approximation: assume 4 characters per token on average.
    return max((len(stripped) + 3) // 4, 1)


def _iter_contents(history: Iterable[Mapping[str, object]] | None) -> Sequence[str]:
    if not history:
        return []
    contents: list[str] = []
    for entry in history:
        if not isinstance(entry, Mapping):
            continue
        content = entry.get("content")
        if isinstance(content, str):
            contents.append(content)
    return contents


def estimate_prompt_tokens(text: str, *, history: Iterable[Mapping[str, object]] | None = None) -> int:
    """Estimate the number of tokens used for a prompt and optional history."""

    total = _count_tokens_from_text(text)
    for content in _iter_contents(history):
        total += _count_tokens_from_text(content)
    return total


def estimate_total_cost(tokens: int, *, rate: Decimal) -> Decimal:
    """Estimate spend for a token count at the provided rate."""

    if tokens <= 0:
        return Decimal("0")
    return (Decimal(tokens) * rate).quantize(Decimal("0.000001"))
