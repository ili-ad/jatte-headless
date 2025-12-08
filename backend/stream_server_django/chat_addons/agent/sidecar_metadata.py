import json
import re
from typing import Any, Dict, List, Tuple

from .sidecar_catalog import SIDECAR_ITEM_DEFS


# Match a trailing line of the form:
#   SIDECAR_JSON: [ ...json... ]
# allowing multiline JSON and trailing whitespace.
SIDECAR_JSON_RE = re.compile(
    r"SIDECAR_JSON:\s*(\[[\s\S]*])\s*$",
    re.MULTILINE,
)


def extract_sidecar_metadata(raw_text: str) -> Tuple[str, List[Dict[str, str]]]:
    """
    Given the full LLM answer text, optionally including a SIDECAR_JSON trailer,
    return a tuple of:

        (clean_text_without_trailer, sidecar_suggestions)

    where sidecar_suggestions is a list of {"id": str, "reason": str}.

    - If there is no SIDECAR_JSON line, returns (raw_text, []).
    - If the JSON is malformed, the SIDECAR_JSON line is stripped but the
      suggestions list is empty.
    - Only ids present in SIDECAR_ITEM_DEFS are kept.
    """
    if not raw_text:
        return raw_text, []

    match = SIDECAR_JSON_RE.search(raw_text)
    if not match:
        return raw_text, []

    json_str = match.group(1)

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError:
        # Strip the trailer but ignore sidecar suggestions
        clean = raw_text[: match.start()].rstrip()
        return clean, []

    if not isinstance(parsed, list):
        clean = raw_text[: match.start()].rstrip()
        return clean, []

    allowed_ids = {item.id for item in SIDECAR_ITEM_DEFS}
    suggestions: List[Dict[str, str]] = []

    for item in parsed:
        if not isinstance(item, dict):
            continue
        item_id = item.get("id")
        if not item_id or item_id not in allowed_ids:
            # Ignore unknown or hallucinated ids
            continue
        reason = item.get("reason") or ""
        suggestions.append({"id": str(item_id), "reason": str(reason)})

    clean_text = raw_text[: match.start()].rstrip()

    return clean_text, suggestions
