#!/usr/bin/env python3
"""
Re-generate the wireup_manifest.json with `stubName`, `ticketType`, `todoCount`.
Assumes:
  • openapi/backend-openapi-spec.yml      (source of operationIds)
  • openapi/wireup_manifest.json          (old manifest, may lack new fields)
  • todo_all.csv                          (token,count CSV you produced)
"""

import json, yaml, csv, pathlib, sys, collections

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "openapi" / "wireup_manifest.json"
SPEC_PATH     = ROOT / "openapi" / "backend-openapi-spec.yml"
TODO_CSV      = ROOT / "todo_all.csv"

# -----------------------------------------------------------------------------
# 1.  Load backend spec → set of operationIds
# -----------------------------------------------------------------------------
spec_ops = set()
spec = yaml.safe_load(SPEC_PATH.read_text())
for path, path_item in (spec.get("paths") or {}).items():
    for method, obj in path_item.items():
        if isinstance(obj, dict) and "operationId" in obj:
            spec_ops.add(obj["operationId"])

# -----------------------------------------------------------------------------
# 2.  Load stub counts
# -----------------------------------------------------------------------------
token_counts = {}
with open(TODO_CSV) as fh:
    reader = csv.DictReader(fh)
    for row in reader:
        token_counts[row["token"]] = int(row["count"])

# -----------------------------------------------------------------------------
# 3.  Existing manifest (if any) → keep method/path/etc.
# -----------------------------------------------------------------------------
if MANIFEST_PATH.exists():
    manifest = json.loads(MANIFEST_PATH.read_text())
else:
    manifest = []

# index by operationId for in-place update
mani_by_op = {entry["operationId"]: entry for entry in manifest}

# -----------------------------------------------------------------------------
# 4.  Helper: classify each token
# -----------------------------------------------------------------------------
def classify(token: str):
    """Return ('api'|'shim', operationId_or_None)"""
    # 4-a. direct match (token == operationId)
    if token in spec_ops:
        return "api", token
    # 4-b. camelCase ↔ snake_case / createMessage ↔ sendMessage   (simple heuristics)
    snake = "".join("_"+c.lower() if c.isupper() else c for c in token).lstrip("_")
    if snake in spec_ops:
        return "api", snake
    camel = "".join(part.capitalize() if i else part
                    for i, part in enumerate(token.split("_")))
    if camel in spec_ops:
        return "api", camel
    # 4-c. not an API op → shim
    return "shim", None

# -----------------------------------------------------------------------------
# 5.  Build / update manifest entries
# -----------------------------------------------------------------------------
new_manifest = []
for token, cnt in token_counts.items():
    kind, opid = classify(token)

    if kind == "api":
        # Keep existing entry or create skeleton
        e = mani_by_op.get(opid, {
            "method": "",           # fill manually if skeleton
            "path": "",
            "operationId": opid,
            "status": "missing",
        })
        e.update({
            "stubName": token,
            "ticketType": "api",
            "todoCount": cnt,
        })
        new_manifest.append(e)
    else:
        # shim ticket (one per unique token)
        new_manifest.append({
            "method": "",
            "path": "",
            "operationId": f"shim::{token}",
            "stubName": token,
            "ticketType": "shim",
            "todoCount": cnt,
            "status": "missing",
        })

# sort: api first, keep deterministic order
new_manifest.sort(key=lambda x: (x["ticketType"], x["operationId"]))

MANIFEST_PATH.write_text(json.dumps(new_manifest, indent=2))
print(f"✅ Rewrote manifest with {len(new_manifest)} entries → {MANIFEST_PATH}")
