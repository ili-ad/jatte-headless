#!/usr/bin/env python3
"""
• Reads:
    openapi/backend-openapi-spec.yml
    todo_all.csv
• Emits/updates:
    openapi/stub_map.json      (token → operationId   for REST tickets)
    openapi/shim_buckets.json  (prefix buckets for SDK/state helpers)

Existing keys in stub_map.json are *preserved*; new pairs are added.
"""

import yaml, csv, pathlib, json, re, collections

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = yaml.safe_load((ROOT / "openapi" / "backend-openapi-spec.yml").read_text())

# collect every operationId in the backend spec
ops = {
    obj["operationId"]
    for path_item in SPEC["paths"].values()
    for obj in path_item.values()
    if isinstance(obj, dict) and "operationId" in obj
}


def camel(s):  # foo_bar → fooBar
    return re.sub(r"_([a-z])", lambda m: m.group(1).upper(), s)


def snake(s):  # fooBar → foo_bar
    return re.sub(r"([A-Z])", r"_\1", s).lower().lstrip("_")


# ---------------------------------------------------------------------------
# 0. load existing stub_map (will be preserved)
# ---------------------------------------------------------------------------
MAP_PATH = ROOT / "openapi" / "stub_map.json"
stub_map = json.loads(MAP_PATH.read_text()) if MAP_PATH.exists() else {}
original_map = stub_map.copy()  # keep a copy to merge later

# ---------------------------------------------------------------------------
# 1. read all TODO tokens with counts
# ---------------------------------------------------------------------------
token_counts = {}
with open(ROOT / "todo_all.csv") as fh:
    reader = csv.DictReader(fh)
    for row in reader:
        token_counts[row["token"]] = int(row["count"])

# ---------------------------------------------------------------------------
# 2. classify each token
# ---------------------------------------------------------------------------
shim_tokens: dict[str, int] = collections.defaultdict(int)

for tok, cnt in token_counts.items():
    # skip if user already mapped it
    if tok in original_map:
        continue

    # four quick tests for match → operationId
    match = (
        tok
        if tok in ops
        else snake(tok)
        if snake(tok) in ops
        else camel(tok)
        if camel(tok) in ops
        else None
    )

    if match:
        stub_map[tok] = match  # API ticket
    else:
        shim_tokens[tok] += cnt  # Shim token

# ---------------------------------------------------------------------------
# 3. bucket shim helpers by first segment (client.*, channel.*, polls.* …)
# ---------------------------------------------------------------------------
buckets = collections.defaultdict(list)
for t in shim_tokens:
    key = t.split(".")[0].split("::")[0]  # client.on → client
    buckets[key].append(t)

# ---------------------------------------------------------------------------
# 4. write results back, preserving originals
# ---------------------------------------------------------------------------
original_map.update(stub_map)  # add new pairs, keep old ones
MAP_PATH.write_text(json.dumps(original_map, indent=2))

(ROOT / "openapi" / "shim_buckets.json").write_text(json.dumps(buckets, indent=2))

print(f"API tokens  : {len(original_map)}")
print(f"Shim buckets: {len(buckets)}  (see shim_buckets.json)")
