#!/usr/bin/env python3
"""
• Reads:
    openapi/backend-openapi-spec.yml
    todo_all.csv
• Emits:
    openapi/stub_map.json        (token → operationId   for REST tickets)
    openapi/shim_buckets.json    (rough buckets for SDK/state helpers)
"""

import yaml, csv, pathlib, json, re, collections

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = yaml.safe_load((ROOT/"openapi/backend-openapi-spec.yml").read_text())
ops = {o for p in SPEC["paths"] for o in
       [SPEC["paths"][p][m]["operationId"] for m in SPEC["paths"][p]]}

def camel(s):  # foo_bar → fooBar
    return re.sub(r'_([a-z])', lambda m:m.group(1).upper(), s)

def snake(s):  # fooBar → foo_bar
    return re.sub(r'([A-Z])', r'_\1', s).lower().lstrip('_')

# ----------------------------------------------------------------
stub_map, shim_tokens = {}, collections.defaultdict(int)
for tok, cnt in csv.reader(open(ROOT/"todo_all.csv")):
    if tok == "token":  # header row
        continue
    match = (
        tok if tok in ops else
        snake(tok) if snake(tok) in ops else
        camel(tok) if camel(tok) in ops else
        None
    )
    if match:
        stub_map[tok] = match           # API ticket
    else:
        shim_tokens[tok] += int(cnt)    # Shim bucket

# Simple heuristic: bucket by prefix before first dot or camel boundary
buckets = collections.defaultdict(list)
for t in shim_tokens:
    key = t.split(".")[0].split("::")[0]      # client.on → client
    buckets[key].append(t)

# ----------------------------------------------------------------
(ROOT/"openapi/stub_map.json").write_text(json.dumps(stub_map, indent=2))
(ROOT/"openapi/shim_buckets.json").write_text(json.dumps(buckets, indent=2))

print(f"API tokens  : {len(stub_map)}")
print(f"Shim buckets: {len(buckets)}  (see shim_buckets.json)")
