# chat_addons/management/commands/embed_chunks.py

from __future__ import annotations

import os
from typing import List

from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from chat_addons.agent.models import DocumentChunk


class Command(BaseCommand):
    help = "Embed DocumentChunk.text for chunks without embeddings using OpenAI."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--state",
            type=str,
            default="FL",
            help="State code to embed chunks for (default: FL).",
        )
        parser.add_argument(
            "--model",
            type=str,
            default="text-embedding-3-small",
            help="OpenAI embeddings model to use (default: text-embedding-3-small).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=64,
            help="Number of chunks to embed per API call (default: 64).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show which chunks would be embedded without writing to the DB.",
        )

    def handle(self, *args, **options) -> None:
        state: str = options["state"]
        model: str = options["model"]
        batch_size: int = options["batch_size"]
        dry_run: bool = options["dry_run"]

        api_key = (
            getattr(settings, "OPENAI_API_KEY", None)
            or os.getenv("OPENAI_API_KEY")
        )
        if not api_key:
            self.stderr.write(
                self.style.ERROR(
                    "OPENAI_API_KEY is not configured. "
                    "Set it in settings or environment before running this command."
                )
            )
            return

        # Lazy import so the module isn’t required unless we actually run this command.
        try:
            from openai import OpenAI  # type: ignore
        except ImportError:
            self.stderr.write(
                self.style.ERROR(
                    "The 'openai' package is not installed. "
                    "Install it with `pip install openai`."
                )
            )
            return

        client = OpenAI(api_key=api_key)

        qs = DocumentChunk.objects.filter(state=state, embedding__isnull=True)
        total = qs.count()

        if total == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"No chunks with null embeddings for state={state}."
                )
            )
            return

        self.stdout.write(
            self.style.NOTICE(
                f"Embedding {total} chunks for state={state} "
                f"using model={model}, batch_size={batch_size}"
            )
        )

        processed = 0
        while True:
            batch = list(
                qs.order_by("id")[:batch_size]
            )  # always take from the front
            if not batch:
                break

            texts: List[str] = [c.text for c in batch]
            chunk_ids = [c.id for c in batch]

            if dry_run:
                self.stdout.write(
                    self.style.NOTICE(
                        f"Would embed batch of {len(batch)} chunks: "
                        f"ids={chunk_ids[0]}..{chunk_ids[-1]}"
                    )
                )
                processed += len(batch)
                # pretend we embedded them so the loop finishes
                qs = qs.exclude(id__in=chunk_ids)
                continue

            try:
                resp = client.embeddings.create(
                    model=model,
                    input=texts,
                )
            except Exception as exc:
                self.stderr.write(
                    self.style.ERROR(
                        f"OpenAI embeddings request failed: {exc!r}"
                    )
                )
                # Don’t bail the whole run; just stop here.
                break

            if len(resp.data) != len(batch):
                self.stderr.write(
                    self.style.ERROR(
                        f"Embedding response length mismatch: "
                        f"got {len(resp.data)} embeddings for {len(batch)} chunks."
                    )
                )
                break

            # Attach embeddings and save.
            for chunk, emb in zip(batch, resp.data):
                # `emb.embedding` is a list[float] compatible with VectorField.
                chunk.embedding = emb.embedding

            DocumentChunk.objects.bulk_update(batch, ["embedding"], batch_size=batch_size)
            processed += len(batch)
            qs = qs.exclude(id__in=chunk_ids)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Embedded batch of {len(batch)} chunks: "
                    f"ids={chunk_ids[0]}..{chunk_ids[-1]} "
                    f"(total processed: {processed}/{total})"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Total chunks embedded (or would embed in dry-run): {processed}"
            )
        )
