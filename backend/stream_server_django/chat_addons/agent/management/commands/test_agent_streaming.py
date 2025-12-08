"""Smoke-test OpenAI streaming from the agent runtime."""

from __future__ import annotations

import time
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from ...services.llm_client import LLMClient
from ...config import AGENT_MAX_TOKENS, AGENT_MODEL, AGENT_STREAMING_TIMEOUT_SEC


class Command(BaseCommand):
    help = "Call the configured agent LLM provider with streaming and report progress."

    def add_arguments(self, parser) -> None:  # type: ignore[override]
        parser.add_argument(
            "--prompt",
            default="Say hello in one sentence.",
            help="Prompt to send to the LLM.",
        )
        parser.add_argument(
            "--max-tokens",
            default=64,
            type=int,
            help="Maximum completion tokens for the call.",
        )
        parser.add_argument(
            "--timeout",
            default=AGENT_STREAMING_TIMEOUT_SEC,
            type=int,
            help="Streaming timeout in seconds.",
        )

    def handle(self, *args: Any, **options: Any) -> None:  # type: ignore[override]
        prompt = str(options.get("prompt") or "Say hello in one sentence.")
        max_tokens = int(options.get("max_tokens") or 64)
        timeout = options.get("timeout")

        client = LLMClient()

        self.stdout.write(
            "Invoking streaming call: model=%s max_tokens=%s timeout=%ss"
            % (AGENT_MODEL, max_tokens, timeout)
        )

        messages = [{"role": "user", "content": prompt}]

        first_update_at: float | None = None
        last_buffer = ""

        def on_update(buffer: str) -> None:
            nonlocal first_update_at, last_buffer
            last_buffer = buffer
            if first_update_at is None:
                first_update_at = time.perf_counter()
                self.stdout.write(
                    self.style.SUCCESS(
                        "First tokens streamed after %.2fs" % (first_update_at - start)
                    )
                )
            self.stdout.write(buffer)

        start = time.perf_counter()
        try:
            result = client.run_streaming(
                messages,
                model=AGENT_MODEL,
                max_tokens=min(max_tokens, AGENT_MAX_TOKENS),
                timeout=timeout,
                on_update=on_update,
                context={"cid": "management:test_agent_streaming"},
            )
        except Exception as exc:  # pragma: no cover - diagnostic command
            elapsed = time.perf_counter() - start
            raise CommandError(f"Streaming call failed after {elapsed:.2f}s: {exc}") from exc

        elapsed = time.perf_counter() - start
        self.stdout.write(self.style.SUCCESS(f"Completed in {elapsed:.2f}s"))
        self.stdout.write(
            self.style.SUCCESS(
                "Tokens used: %s | Reason: %s" % (result.tokens_used, result.reason)
            )
        )
        if not first_update_at:
            self.stdout.write(self.style.WARNING("No streaming updates received."))
        elif last_buffer.strip() != (result.content or "").strip():
            self.stdout.write(
                self.style.WARNING("Final content differed from streamed buffer; check logs."),
            )

