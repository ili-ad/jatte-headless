"""Definitions for generic interactive sidecar items.

This module defines reusable types and helpers for describing interactive
sidecar items (forms, pages, links, etc.) that can be suggested alongside
agent responses. It is groundwork only; nothing in the agent or RAG stack
imports this yet.
"""

from dataclasses import dataclass
from typing import Iterable, List, Optional


@dataclass
class SidecarItemDef:
    id: str
    kind: str  # "form" | "page" | "link" | ...
    label: str
    short_label: str
    slug: str
    blurb: str
    state: Optional[str] = None  # optional, useful for forms


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
]


def sidecar_items_for_state(state: str) -> List[SidecarItemDef]:
    """
    Return all sidecar items whose state matches the given code (case-insensitive).
    If state is falsy or no items match, returns an empty list.
    """
    if not state:
        return []
    s = state.upper()
    return [item for item in SIDECAR_ITEM_DEFS if item.state and item.state.upper() == s]


def get_sidecar_item_by_id(item_id: str) -> Optional[SidecarItemDef]:
    """
    Lookup a sidecar item by id. Returns None if not found.
    """
    for item in SIDECAR_ITEM_DEFS:
        if item.id == item_id:
            return item
    return None
