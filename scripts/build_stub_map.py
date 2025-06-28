#!/usr/bin/env python3
"""
Interactive helper:
• Loads existing stub_map.json           (kept, never overwritten)
• Scans todo_all.csv for unknown tokens
• Suggests the best-matching operationId by Levenshtein + fuzzy rules
• Lets you accept (Enter) or edit → writes stub_map.json
"""

import json, csv, pathlib, re, difflib, Levenshtein as lev

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAP_PATH   = ROOT / "openapi/stub_map.json"
CSV_PATH   = ROOT / "todo_all.csv"
SPEC_PATH  = ROOT / "openapi/backend-openapi-spec.yml"

import yaml, itertools, sys

# ----------------------------------------------------------------- helpers
def to_snake(s):
    return re.sub(r'([A-Z])', r'_\1', s).lower().lstrip('_')

def to_camel(s):
    return re.sub(r'_([a-z])', lambda m: m.group(1).upper(), s)

def best_match(token, candidates):
    # score = normalized Levenshtein + prefix bonus
    scores = []
    for c in candidates:
        d = lev.distance(token.lower(), c.lower())
        norm = d / max(len(token), len(c))
        prefix_bonus = 0.1 if c.lower().startswith(token.lower()[:3]) else 0
        scores.append((norm - prefix_bonus, c))
    scores.sort()
    return scores[0][1]  # lowest score

# ----------------------------------------------------------------- load data
stub_map   = json.loads(MAP_PATH.read_text()) if MAP_PATH.exists() else {}
spec_ops   = set()
spec       = yaml.safe_load(SPEC_PATH.read_text())
for p in spec["paths"].values():
    for obj in p.values():
        spec_ops.add(obj["operationId"])

tokens = [row["token"] for row in csv.DictReader(open(CSV_PATH))]
unknown = [t for t in tokens if t not in stub_map]

# ----------------------------------------------------------------- interactive loop
print(f"{len(unknown)} tokens missing from stub_map.json\n")
for tok in unknown:
    snake, camel = to_snake(tok), to_camel(tok)
    choices = list(spec_ops)
    guess = None
    if tok in spec_ops: guess = tok
    elif snake in spec_ops: guess = snake
    elif camel in spec_ops: guess = camel
    else: guess = best_match(tok, choices)

    if lev.distance(tok.lower(), guess.lower()) > 6:
        # probably unrelated – default to blank (shim)
        continue

    prompt = f"{tok:<25} → {guess}   [Enter=yes / edit / n=no]: "
    ans = input(prompt).strip()
    if ans.lower() == "n":
        continue
    stub_map[tok] = guess if ans == "" else ans

# ----------------------------------------------------------------- save
MAP_PATH.write_text(json.dumps(stub_map, indent=2))
print(f"📝  stub_map.json now has {len(stub_map)} entries")
