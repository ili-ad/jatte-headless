"""Florida sidecar definitions for NTO deployments."""
from __future__ import annotations

from stream_server_django.chat_addons.agent.sidecar_catalog import SidecarItemDef


def get_sidecar_defs_fl(meta: dict) -> list[SidecarItemDef]:
    _ = meta
    return [
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
