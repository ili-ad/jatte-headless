from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence


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
