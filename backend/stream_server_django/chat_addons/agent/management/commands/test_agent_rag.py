from __future__ import annotations

from textwrap import shorten

from django.core.management.base import BaseCommand, CommandError

from stream_server_django.chat_addons.agent.services.vector_memory import embed_query, search_similar


class Command(BaseCommand):
    help = "Test the RAG pipeline for a given prompt using the same logic as AgentService."

    def add_arguments(self, parser):
        parser.add_argument(
            "prompt",
            nargs="?",
            help="The user question / prompt to run through RAG.",
        )
        parser.add_argument(
            "--state",
            dest="state",
            default=None,
            help="Optional state filter (e.g. FL). Defaults to FL if omitted.",
        )
        parser.add_argument(
            "--topic",
            dest="topic",
            default=None,
            help="Optional topic filter (e.g. '713.16').",
        )
        parser.add_argument(
            "--k",
            dest="k",
            type=int,
            default=5,
            help="Number of top chunks to retrieve (default: 5).",
        )

    def handle(self, *args, **options):
        prompt = options["prompt"]
        if not prompt:
            raise CommandError("You must provide a prompt question.")

        state = options["state"] or "FL"
        topic = options["topic"]
        k = options["k"]

        self.stdout.write(
            f"[RAG] prompt={prompt!r} state={state!r} topic={topic!r} k={k}"
        )

        try:
            query_emb = embed_query(prompt)
            chunks = search_similar(
                state=state,
                query_embedding=query_emb,
                k=k,
                topic=topic,
            )
        except Exception as exc:  # pragma: no cover - CLI feedback
            raise CommandError(f"RAG search failed: {exc!r}")

        if not chunks:
            self.stdout.write(self.style.WARNING("[RAG] no chunks found"))
            return

        self.stdout.write(
            self.style.SUCCESS(f"[RAG] found {len(chunks)} chunk(s); top {k}:")
        )
        for i, ch in enumerate(chunks[:k], start=1):
            chunk_id = getattr(ch, "id", None) or getattr(ch, "pk", None)
            score = (
                getattr(ch, "score", None)
                or getattr(ch, "distance", None)
                or getattr(ch, "similarity", None)
            )
            text = getattr(ch, "text", None) or getattr(ch, "body", None)
            snippet = shorten(text or "", width=160, placeholder="...")

            self.stdout.write(
                f"  {i}. id={chunk_id!r} score={score!r} snippet={snippet!r}"
            )
