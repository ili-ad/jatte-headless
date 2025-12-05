from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import List, Sequence, Tuple


@dataclass
class FormDef:
    id: str
    state: str
    label: str
    short_label: str
    slug: str
    kind: str
    blurb: str


FORM_DEFS: List[FormDef] = [
    FormDef(
        id="FL_NOC",
        state="FL",
        label="Florida Notice of Commencement",
        short_label="Notice of Commencement",
        slug="notice-of-commencement",
        kind="noc",
        blurb="Record this to start the project and lock in lien priority.",
    ),
    FormDef(
        id="FL_NTO_SUB",
        state="FL",
        label="Florida Notice to Owner (Subcontractor)",
        short_label="Subcontractor NTO",
        slug="notice-to-owner-sub",
        kind="nto",
        blurb="Preserves lien rights for subs and suppliers.",
    ),
    FormDef(
        id="FL_LIEN_WAIVER_PARTIAL",
        state="FL",
        label="Florida Partial Lien Waiver",
        short_label="Partial Lien Waiver",
        slug="partial-lien-waiver",
        kind="waiver",
        blurb="Exchange for payment to release lien rights on completed work to date.",
    ),
]


def forms_for_state(state: str) -> List[FormDef]:
    normalized = (state or "").upper()
    return [f for f in FORM_DEFS if f.state.upper() == normalized]


def format_forms_prompt(forms: Sequence[FormDef]) -> str | None:
    """Create a prompt block describing available forms and output contract."""

    lines: list[str] = [
        "We also sell standard construction forms that may help the user.",
        "Available forms for this state:",
    ]
    if forms:
        lines.extend(f"- {form.id}: {form.label} – {form.blurb}" for form in forms)
    else:
        lines.append("- (none)")

    lines.extend(
        [
            "",
            "After you finish your natural-language answer, decide whether one or more of these forms would help the user take the next step.",
            "Then output a FINAL machine-readable line on its own:",
            'FORMS_JSON: [{"id": "FL_NOC", "reason": "To record a notice of commencement"}, ...]',
            "- Use only form ids from the list above.",
            "- At most 3 suggestions.",
            "- If no form is appropriate, output: FORMS_JSON: []",
            "- Do NOT explain this line; just emit it as shown.",
        ]
    )

    return "\n".join(lines)


FORMS_RE = re.compile(r"FORMS_JSON:\s*(\[.*\])\s*$", re.DOTALL)


def extract_forms_metadata(text: str) -> Tuple[str, list[dict[str, str]]]:
    """Strip the FORMS_JSON line from the reply and return parsed metadata."""

    match = FORMS_RE.search(text or "")
    if not match:
        return text, []

    json_str = match.group(1)
    try:
        raw = json.loads(json_str)
    except json.JSONDecodeError:
        return text.replace(match.group(0), "").rstrip(), []

    allowed_ids = {form.id for form in FORM_DEFS}
    cleaned: list[dict[str, str]] = []
    for item in raw if isinstance(raw, list) else []:
        form_id = item.get("id") if isinstance(item, dict) else None
        reason = item.get("reason", "") if isinstance(item, dict) else ""
        if not form_id or form_id not in allowed_ids:
            continue
        cleaned.append({"id": form_id, "reason": reason})

    new_text = text.replace(match.group(0), "").rstrip()
    return new_text, cleaned
