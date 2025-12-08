from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, TypedDict


class ConversationCtx(TypedDict):
    """Shallow context passed to skills during execution."""

    cid: str
    user_id: str
    now: datetime
    metadata: Dict[str, Any]
