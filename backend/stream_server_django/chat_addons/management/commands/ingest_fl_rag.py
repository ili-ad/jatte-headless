# chat_addons/agent/management/commands/ingest_fl_rag.py

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, List, Tuple

from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser

from stream_server_django.chat_addons.agent.models import DocumentChunk


# Heuristics
TARGET_CHARS_PER_CHUNK = 1800  # ~ 600–800 tokens-ish
MAX_CHARS_PER_CHUNK = 2400     # hard cap


class Command(BaseCommand):
    help = "Ingest Florida lien-law markdown docs into DocumentChunk rows."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--root",
            type=str,
            default=None,
            help=(
                "Root folder containing md/ with Florida markdown docs. "
                "Defaults to BASE_DIR / 'RAG/md'."
            ),
        )
        parser.add_argument(
            "--state",
            type=str,
            default="FL",
            help="State code for these chunks (default: FL).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and report counts without writing to the database.",
        )

    def handle(self, *args, **options) -> None:
        root_arg = options["root"]
        state = options["stream_server_django.state"]
        dry_run = options["dry_run"]

        base_dir = Path(settings.BASE_DIR).resolve()
        if root_arg:
            root = Path(root_arg).expanduser().resolve()
        else:
            root = base_dir.parent / "RAG" / "md"  # ~/dev/jatte-headless/RAG/md

        if not root.is_dir():
            self.stderr.write(self.style.ERROR(f"Root folder not found: {root}"))
            return

        md_files = sorted(root.glob("*.md"))
        if not md_files:
            self.stderr.write(self.style.WARNING(f"No .md files found in {root}"))
            return

        self.stdout.write(self.style.NOTICE(f"Using root: {root}"))
        self.stdout.write(self.style.NOTICE(f"Found {len(md_files)} markdown files."))

        total_chunks = 0
        for md_path in md_files:
            doc_name = md_path.name
            topic = infer_topic_from_filename(doc_name)

            with md_path.open("r", encoding="utf-8") as f:
                text = f.read()

            sections = split_into_sections(text)

            chunk_index = 0
            doc_chunks: List[DocumentChunk] = []

            for heading, body in sections:
                for chunk_text, est_tokens in chunk_section(heading, body):
                    if dry_run:
                        # Just count; don't create objects.
                        total_chunks += 1
                        chunk_index += 1
                        continue

                    chunk = DocumentChunk(
                        state=state,
                        topic=topic,
                        doc_name=doc_name,
                        chunk_index=chunk_index,
                        heading=heading,
                        text=chunk_text,
                        tokens_estimated=est_tokens,
                        metadata={
                            "source_path": str(md_path),
                        },
                    )
                    doc_chunks.append(chunk)
                    chunk_index += 1
                    total_chunks += 1

            if not dry_run and doc_chunks:
                DocumentChunk.objects.bulk_create(doc_chunks, batch_size=100)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Ingested {len(doc_chunks)} chunks from {doc_name} (topic={topic})."
                    )
                )
            else:
                self.stdout.write(
                    self.style.NOTICE(
                        f"Would ingest {chunk_index} chunks from {doc_name} (topic={topic})."
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(f"Done. Total chunks processed: {total_chunks}")
        )


def infer_topic_from_filename(doc_name: str) -> str:
    """
    Very simple topic inference from filenames like
    'florida_noc_compliance.md' -> 'noc_compliance'.
    """
    base = os.path.splitext(doc_name)[0]
    parts = base.split("_")
    # strip leading 'florida' if present
    if parts and parts[0].lower() == "florida":
        parts = parts[1:]
    return "_".join(parts) or "unknown"


def split_into_sections(text: str) -> List[Tuple[str, str]]:
    """
    Very simple section splitter:
    - Split on '## ' headings if present.
    - If none, treat the whole doc as a single section with empty heading.

    Returns a list of (heading, body_text).
    """
    lines = text.splitlines()
    sections: List[Tuple[str, List[str]]] = []
    current_heading = ""
    current_body: List[str] = []

    def push_section():
        if current_body or current_heading:
            sections.append((current_heading.strip(), current_body.copy()))

    for line in lines:
        if line.startswith("## "):
            # new section heading
            push_section()
            current_heading = line.lstrip("#").strip()
            current_body = []
        else:
            current_body.append(line)
    push_section()

    result: List[Tuple[str, str]] = []
    for heading, body_lines in sections:
        body_text = "\n".join(body_lines).strip()
        if not body_text:
            continue
        result.append((heading, body_text))
    return result


def estimate_tokens_from_chars(text: str) -> int:
    """
    Crude heuristic: ~4 chars per token.
    """
    return max(1, int(len(text) / 4))


def chunk_section(heading: str, body: str) -> Iterable[Tuple[str, int]]:
    """
    Chunk a single section body into smaller pieces while preserving context.

    Strategy:
    - Split on blank lines.
    - Greedily accumulate paragraphs up to TARGET_CHARS_PER_CHUNK,
      allowing up to MAX_CHARS_PER_CHUNK.
    - Small overlap: repeat last paragraph of previous chunk.
    """
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
    if not paragraphs:
        return []

    chunks: List[Tuple[str, int]] = []
    current_paras: List[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para)
        # If this paragraph alone is bigger than MAX, just force a chunk.
        if para_len >= MAX_CHARS_PER_CHUNK:
            if current_paras:
                chunk_text = build_chunk_text(heading, current_paras)
                chunks.append((chunk_text, estimate_tokens_from_chars(chunk_text)))
                current_paras = []
                current_len = 0
            chunk_text = build_chunk_text(heading, [para])
            chunks.append((chunk_text, estimate_tokens_from_chars(chunk_text)))
            continue

        if current_len + para_len > TARGET_CHARS_PER_CHUNK:
            # finalize current chunk
            if current_paras:
                chunk_text = build_chunk_text(heading, current_paras)
                chunks.append((chunk_text, estimate_tokens_from_chars(chunk_text)))

                # small overlap: keep last paragraph as seed for next chunk
                last_para = current_paras[-1]
                current_paras = [last_para]
                current_len = len(last_para)
            else:
                # no current chunk; start a new one with this paragraph
                current_paras = [para]
                current_len = para_len
        else:
            current_paras.append(para)
            current_len += para_len

    if current_paras:
        chunk_text = build_chunk_text(heading, current_paras)
        chunks.append((chunk_text, estimate_tokens_from_chars(chunk_text)))

    return chunks


def build_chunk_text(heading: str, paragraphs: List[str]) -> str:
    """
    Build the final chunk text, including heading for context.
    """
    parts: List[str] = []
    if heading:
        parts.append(f"## {heading}")
    parts.extend(paragraphs)
    return "\n\n".join(parts).strip()
