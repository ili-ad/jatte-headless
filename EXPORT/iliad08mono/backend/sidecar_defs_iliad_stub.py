"""Iliad sidecar definitions stub."""
from __future__ import annotations

from stream_server_django.chat_addons.agent.sidecar_catalog import SidecarItemDef


def get_sidecar_defs_iliad(meta: dict) -> list[SidecarItemDef]:
    _ = meta
    return [
        SidecarItemDef(
            id="ILIAD_PRESS_KIT",
            kind="page",
            label="Iliad Press Kit",
            short_label="Press Kit",
            slug="press-kit",
            blurb="Official imagery and brand assets.",
        ),
        SidecarItemDef(
            id="ILIAD_COLLECTIONS",
            kind="page",
            label="Collections Index",
            short_label="Collections",
            slug="collections",
            blurb="Browse current and archival collections.",
        ),
    ]
