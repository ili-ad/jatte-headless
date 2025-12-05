from dataclasses import dataclass
from typing import List, Optional


@dataclass
class SidecarItemDef:
    """
    Backend definition of an interactive 'sidecar' resource.

    This mirrors the shape of the frontend SidecarItemDef in
    frontend/src/lib/sidecarCatalog.ts, but is implemented in Python
    for the agent service.
    """

    id: str
    kind: str  # e.g. "form", "page", "link", etc.
    label: str
    short_label: str
    slug: str
    blurb: str
    state: Optional[str] = None


# NOTE: This list intentionally mirrors the frontend SIDECAR_ITEM_DEFS.
# Keep these in sync manually or via future tooling/API if needed.
SIDECAR_ITEM_DEFS: List[SidecarItemDef] = [
    SidecarItemDef(
        id="FL_NOC",
        kind="form",
        state="FL",
        label="Florida Notice of Commencement",
        short_label="Notice of Commencement",
        slug="notice-of-commencement",
        blurb="Record this to start the project and lock in lien priority.",
    ),
    SidecarItemDef(
        id="FL_NTO_SUB",
        kind="form",
        state="FL",
        label="Florida Notice to Owner (Subcontractor)",
        short_label="Subcontractor NTO",
        slug="notice-to-owner-sub",
        blurb="Preserves lien rights for subs and suppliers.",
    ),
    # Add additional items here as needed.
]


def get_sidecar_item_by_id(item_id: str) -> Optional[SidecarItemDef]:
    """
    Lookup a sidecar item by id. Returns None if not found.
    """

    for item in SIDECAR_ITEM_DEFS:
        if item.id == item_id:
            return item
    return None


def sidecar_items_for_state(state: Optional[str]) -> List[SidecarItemDef]:
    """
    Return sidecar items scoped to a particular state, if state is provided.

    This is primarily useful for forms; other kinds may leave `state` blank.
    """

    if not state:
        return []
    s = state.upper()
    return [item for item in SIDECAR_ITEM_DEFS if item.state and item.state.upper() == s]
