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


# NOTE: This list is intentionally empty by default. Host apps should provide
# sidecar definitions via the extension hook in chat_addons.agent.extensions.
SIDECAR_ITEM_DEFS: List[SidecarItemDef] = []


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
