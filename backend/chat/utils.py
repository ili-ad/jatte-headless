import time
import random

# Base epoch for snowflake IDs (2024-01-01 in ms)
EPOCH = 1704067200000


def generate_snowflake() -> int:
    """Return a 64-bit time sortable ID."""
    millis = int(time.time() * 1000) - EPOCH
    millis &= (1 << 42) - 1  # clamp to 42 bits
    rand = random.getrandbits(22)
    return (millis << 22) | rand
