"""Management command for running agent evaluation specs."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from ...evals.runner import load_specs, run_specs, write_report


class Command(BaseCommand):
    help = "Execute YAML-defined agent evaluations using the stub LLM."

    def add_arguments(self, parser) -> None:  # type: ignore[override]
        parser.add_argument(
            "--pattern",
            default="*",
            help="Glob-style pattern (without .yaml) selecting eval specs to run.",
        )
        parser.add_argument(
            "--report",
            default=None,
            help="Optional path to write a JSON report with pass/fail details.",
        )

    def handle(self, *args: Any, **options: Any) -> None:  # type: ignore[override]
        pattern = str(options.get("pattern") or "*")
        report_path = options.get("report")

        specs = load_specs(pattern)
        if not specs:
            raise CommandError(f"No eval specs found for pattern '{pattern}'")

        results = run_specs(specs)
        if report_path:
            destination = Path(report_path)
            destination.parent.mkdir(parents=True, exist_ok=True)
            write_report(results, destination)

        all_passed = True
        for result in results:
            if result.passed:
                self.stdout.write(self.style.SUCCESS(f"[PASS] {result.name}"))
            else:
                all_passed = False
                self.stdout.write(self.style.ERROR(f"[FAIL] {result.name}"))
                for failure in result.failures:
                    self.stdout.write(f"  step {failure.step}: {failure.reason}")

        if not all_passed:
            raise CommandError("One or more evals failed")
