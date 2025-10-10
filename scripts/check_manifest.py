#!/usr/bin/env python3
"""Verify Auth & Identity entries in the wire-up manifest are resolved."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, Tuple

EXPECTED_STUBS: Dict[str, str] = {
    "connectUser": "syncUser",
    "disconnectUser": "endSession",
    "refreshToken": "refreshToken",
    "currentUser": "currentUser",
    "wsAuth": "wsAuth",
    "getClientId": "getClientId",
    "getConnectionId": "getConnectionId",
}


def load_manifest(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def load_spec(path: Path) -> Dict[str, Tuple[str, str]]:
    operations: Dict[str, Tuple[str, str]] = {}
    current_path: str | None = None
    current_method: str | None = None

    with path.open("r", encoding="utf-8") as fh:
        for raw_line in fh:
            line = raw_line.rstrip()
            stripped = line.strip()

            if not stripped or stripped.startswith("#"):
                continue

            indent = len(line) - len(line.lstrip(" "))

            if stripped.endswith(":") and not stripped.startswith("-"):
                key = stripped[:-1]
                if indent == 2:  # path level (e.g., "  /sync-user/:")
                    current_path = key
                    current_method = None
                elif indent == 4:  # method level (e.g., "    post:")
                    current_method = key.upper()
                continue

            if stripped.startswith("operationId:") and current_path and current_method:
                _, value = stripped.split(":", 1)
                op_id = value.strip()
                operations[op_id] = (current_method, current_path)

    return operations


def main(manifest_path: str, spec_path: str) -> int:
    manifest_entries = load_manifest(Path(manifest_path))
    spec_operations = load_spec(Path(spec_path))

    unresolved: list[str] = []

    for stub, op_id in EXPECTED_STUBS.items():
        expected = spec_operations.get(op_id)
        if expected is None:
            unresolved.append(f"{stub} ({op_id}) missing from spec")
            continue

        entry = next(
            (item for item in manifest_entries if item.get("stubName") == stub),
            None,
        )
        if entry is None:
            unresolved.append(f"{stub} ({op_id}) missing from manifest")
            continue

        method = (entry.get("method") or "").upper()
        path = entry.get("path") or ""
        if not method or not path:
            unresolved.append(f"{stub} ({op_id}) missing method/path binding")
            continue

        if (method, path) != expected:
            unresolved.append(
                f"{stub} ({op_id}) expected {expected[0]} {expected[1]} but found {method} {path}"
            )

    if unresolved:
        print("Found unresolved operationIds in domain Auth & Identity:")
        for item in unresolved:
            print(f" - {item}")
        return 1

    print("OK: 0 unresolved operationIds in domain Auth & Identity")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: check_manifest.py <manifest> <spec>")
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
