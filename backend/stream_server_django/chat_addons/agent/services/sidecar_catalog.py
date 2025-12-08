"""Local import wrapper for sidecar catalog definitions.

The agent service historically imports ``.sidecar_catalog`` from within the
services package. The canonical definitions live one level up in
``chat_addons.agent.sidecar_catalog``; this module re-exports them so the
existing import path continues to work without duplicating data.
"""

from ..sidecar_catalog import (
    SIDECAR_ITEM_DEFS,
    SidecarItemDef,
    get_sidecar_item_by_id,
    sidecar_items_for_state,
)

__all__ = [
    "SIDECAR_ITEM_DEFS",
    "SidecarItemDef",
    "get_sidecar_item_by_id",
    "sidecar_items_for_state",
]
