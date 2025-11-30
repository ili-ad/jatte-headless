# backend/chat/utils.py
from __future__ import annotations

import random
import time


def canonical_cid(cid: str | None, *, room_uuid: str | None = None) -> str:
    """Return a canonical ``cid`` for the given channel identifier."""

    value = (cid or "").strip()
    if not value:
        if not room_uuid:
            raise ValueError("cid or room_uuid is required")
        value = room_uuid
    if ":" not in value:
        value = f"messaging:{value}"
    return value


def group_name_for_cid(cid: str | None, *, room_uuid: str | None = None) -> str:
    """Return the channel layer group name for a ``cid``."""

    canonical = canonical_cid(cid, room_uuid=room_uuid)
    return f"channel_{canonical.replace(':', '_')}"

# Base epoch for snowflake IDs (2024-01-01 in ms)
EPOCH = 1704067200000


def generate_snowflake() -> int:
    """Return a 64-bit time sortable ID."""
    millis = int(time.time() * 1000) - EPOCH
    millis &= (1 << 42) - 1  # clamp to 42 bits
    rand = random.getrandbits(22)
    return (millis << 22) | rand
