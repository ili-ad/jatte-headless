# chat_addons/management/commands/ingest_fl_rag.py

from __future__ import annotations

from stream_server_django.chat_addons.management.commands.ingest_rag_md import (
    Command as BaseCommand,
)


class Command(BaseCommand):
    help = (
        "Legacy wrapper to ingest Florida lien-law markdown docs into DocumentChunk rows. "
        "Prefer ingest_rag_md for generic workflows."
    )

    def add_arguments(self, parser) -> None:
        super().add_arguments(parser)
        parser.set_defaults(state="FL")
