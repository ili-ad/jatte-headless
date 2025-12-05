from __future__ import annotations

import json
import re
from typing import Dict, List, Tuple

from .forms_catalog import FORM_DEFS

# Match:
#   FORMS_JSON: [ ...json... ]
# at the very end of the string (allowing whitespace)
FORMS_RE = re.compile(r"FORMS_JSON:\s*(\[[\s\S]*])\s*$", re.MULTILINE)


def extract_forms_metadata(raw_text: str) -> Tuple[str, List[Dict[str, str]]]:
    """
    Given the full text returned by the LLM (including the FORMS_JSON trailer),
    return a tuple of:
      (clean_text_without_trailer, forms_metadata_list)

    If there is no FORMS_JSON line or it is invalid, the original text is
    returned and the list is empty.
    """
    if not raw_text:
        return raw_text, []

    match = FORMS_RE.search(raw_text)
    if not match:
        # Nothing to strip or parse
        return raw_text, []

    json_str = match.group(1)

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError:
        # If the JSON is malformed, remove the line but don’t crash
        clean_text = raw_text.replace(match.group(0), "").rstrip()
        return clean_text, []

    if not isinstance(parsed, list):
        clean_text = raw_text.replace(match.group(0), "").rstrip()
        return clean_text, []

    allowed_ids = {f.id for f in FORM_DEFS}

    cleaned: List[Dict[str, str]] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        form_id = item.get("id")
        if form_id not in allowed_ids:
            # Ignore unknown or hallucinated ids
            continue
        reason = item.get("reason") or ""
        cleaned.append({"id": form_id, "reason": reason})

    clean_text = raw_text.replace(match.group(0), "").rstrip()

    return clean_text, cleaned
