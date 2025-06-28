#!/usr/bin/env python3
"""
Re-generate openapi/wireup_manifest.json with correct ticketType.

Logic:
• If token appears in stub_map.json  →  api (operationId = mapping)
• else if token == operationId (camel/snake variants allowed) → api
• else → shim
"""

import json, yaml, pathlib, re, collections, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "openapi" / "wireup_manifest.json"
SPEC_PATH     = ROOT / "openapi" / "backend-openapi-spec.yml"
STUB_MAP_PATH = ROOT / "openapi" / "stub_map.json"
TODO_CSV      = ROOT / "todo_all.csv"

# --------------------------------------------------------------------------
# 0 · Load data sources
# --------------------------------------------------------------------------
stub_map = json.loads(STUB_MAP_PATH.read_text()) if STUB_MAP_PATH.exists() else {}

spec_ops = set()
spec = yaml.safe_load(SPEC_PATH.read_text())
for p in spec["paths"].values():
    for obj in p.values():
        if isinstance(obj, dict) and "operationId" in obj:
            spec_ops.add(obj["operationId"])

def camel(s):  # foo_bar → fooBar
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), s)

def snake(s):  # fooBar → foo_bar
    return re.sub(r'([A-Z])', r'_\1', s).lower().lstrip('_')

# token → count
todo_counts = {}
with open(TODO_CSV) as fh:
    for line in fh.read().splitlines()[1:]:          # skip header
        token, cnt = line.split(",")
        todo_counts[token] = int(cnt)

# --------------------------------------------------------------------------
# 1 · Build manifest entries
# --------------------------------------------------------------------------
new_manifest = []
for token, cnt in todo_counts.items():
    # -- API via explicit stub_map -------------
    if token in stub_map:
        op_id = stub_map[token]
        entry = {
            "method": "",
            "path": "",
            "operationId": op_id,
            "stubName": token,
            "ticketType": "api",
            "todoCount": cnt,
            "status": "missing",
        }
        new_manifest.append(entry)
        continue

    # -- API via direct name / camel / snake ----
    direct = (
        token if token in spec_ops else
        camel(token) if camel(token) in spec_ops else
        snake(token) if snake(token) in spec_ops else
        None
    )
    if direct:
        entry = {
            "method": "",
            "path": "",
            "operationId": direct,
            "stubName": token,
            "ticketType": "api",
            "todoCount": cnt,
            "status": "missing",
        }
        new_manifest.append(entry)
        continue

    # -- otherwise shim ------------------------
    entry = {
        "method": "",
        "path": "",
        "operationId": f"shim::{token}",
        "stubName": token,
        "ticketType": "shim",
        "todoCount": cnt,
        "status": "missing",
    }
    new_manifest.append(entry)

# deterministic order: api first, then shim
new_manifest.sort(key=lambda e: (e["ticketType"], e["operationId"]))

MANIFEST_PATH.write_text(json.dumps(new_manifest, indent=2))
print(f"✅ Manifest rewritten with {len(new_manifest)} entries "
      f"({sum(1 for e in new_manifest if e['ticketType']=='api')} api, "
      f"{sum(1 for e in new_manifest if e['ticketType']=='shim')} shim)")
