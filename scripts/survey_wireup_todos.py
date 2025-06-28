#!/usr/bin/env python3
"""
Survey ALL `// TODO backend-wire-up:` stubs and bucket them.

Outputs:
  • todo_all.csv          – every unique token + count
  • todo_by_file.csv      – file → tokens
  • todo_state.csv        – tokens that look like `.state.` helpers
"""

import re, pathlib, csv, collections, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC  = ROOT / "libs" / "stream-chat-shim" / "src"
PAT  = re.compile(r"backend-wire-up:\s*([^ */]+)")

tokens      = collections.Counter()
by_file     = collections.defaultdict(list)

for path in SRC.rglob("*.ts*"):
    for ln, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
        m = PAT.search(line)
        if m:
            tok = m.group(1).strip()
            tokens[tok] += 1
            by_file[path].append((ln, tok))

# 1. todo_all.csv
with open(ROOT / "todo_all.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["token", "count"])
    for tok, cnt in tokens.most_common():
        w.writerow([tok, cnt])

# 2. todo_by_file.csv
with open(ROOT / "todo_by_file.csv", "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["file", "line", "token"])
    for path, items in by_file.items():
        for ln, tok in items:
            w.writerow([str(path.relative_to(ROOT)), ln, tok])

# 3. todo_state.csv – anything with ".state." or ".threads."
state_toks = [t for t in tokens if ".state." in t or ".threads." in t]
with open(ROOT / "todo_state.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["token", "count"])
    for tok in state_toks:
        w.writerow([tok, tokens[tok]])

print(f"🔍 scanned {sum(tokens.values())} stubs → {len(tokens)} unique tokens")
print("• todo_all.csv            (unique stub tokens)")
print("• todo_by_file.csv        (file, line, token)")
print("• todo_state.csv          (potential state-helper calls)")
