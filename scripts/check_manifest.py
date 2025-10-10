#!/usr/bin/env python3
"""Validate that each manifest row has a resolved (method, path)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Dict, Iterable, Tuple

import yaml


HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}


def load_operation_map(spec_paths: Iterable[Path]) -> Dict[str, Tuple[str, str]]:
    mapping: Dict[str, Tuple[str, str]] = {}
    for spec_path in spec_paths:
        with spec_path.open("r", encoding="utf-8") as handle:
            spec = yaml.safe_load(handle)
        paths = spec.get("paths", {}) if isinstance(spec, dict) else {}
        for url, operations in paths.items():
            if not isinstance(operations, dict):
                continue
            for method, details in operations.items():
                if method.upper() not in HTTP_METHODS:
                    continue
                if not isinstance(details, dict):
                    continue
                op_id = details.get("operationId")
                if not op_id or op_id in mapping:
                    continue
                mapping[op_id] = (method.upper(), url)
    return mapping


def check_manifest(manifest_path: Path, spec_paths: Iterable[Path]) -> int:
    operation_map = load_operation_map(spec_paths)
    with manifest_path.open("r", encoding="utf-8") as handle:
        manifest = json.load(handle)

    unresolved = []
    for row in manifest:
        if not isinstance(row, dict):
            continue
        op_id = row.get("operationId")
        if not op_id:
            continue
        method = row.get("method")
        path = row.get("path")
        if method and path:
            continue
        match = operation_map.get(op_id)
        if match:
            method = method or match[0]
            path = path or match[1]
        if not method or not path:
            unresolved.append(op_id)

    if unresolved:
        print(f"Unresolved operationIds ({len(unresolved)}):")
        for op_id in sorted(set(unresolved)):
            print(f" - {op_id}")
        return 1

    print("OK: all operationIds resolved to (method, path)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("frontend_spec", type=Path)
    parser.add_argument("backend_spec", type=Path)
    args = parser.parse_args(argv)

    return check_manifest(args.manifest, [args.frontend_spec, args.backend_spec])


if __name__ == "__main__":
    sys.exit(main())
