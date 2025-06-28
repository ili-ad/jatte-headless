#!/usr/bin/env python3
"""
Generate ChatGPT prompt files from wireup_manifest.json
======================================================

* `ticketType:"api"`  → api_<operationId>.md
* `ticketType:"shim"` → shim_<stubName>.md
* Merges /tmp/todo_counts.txt (optional, safe if absent)
* Adds AGENTS.md header to every prompt
"""

import json, pathlib, sys, textwrap

# -----------------------------------------------------------------------
# 0 ·  Paths
# -----------------------------------------------------------------------
ROOT          = pathlib.Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "openapi" / "wireup_manifest.json"
AGENTS_MD     = ROOT / "AGENTS.md"
PROMPT_DIR    = ROOT / "chatgpt_prompts"

if not MANIFEST_PATH.exists():
    sys.exit(f"❌ Manifest not found: {MANIFEST_PATH}")
if not AGENTS_MD.exists():
    sys.exit("❌ AGENTS.md missing at repo root")

# -----------------------------------------------------------------------
# 1 ·  Load manifest + optional todo-counts
# -----------------------------------------------------------------------
manifest = json.loads(MANIFEST_PATH.read_text())

todo_counts = {}
tc_file = pathlib.Path("/tmp/todo_counts.txt")
if tc_file.exists():
    for line in tc_file.read_text().splitlines():
        op, cnt = line.strip().split(":")
        todo_counts[op] = int(cnt)

for e in manifest:
    e["todoCount"] = todo_counts.get(e["operationId"], 0)

# -----------------------------------------------------------------------
# 2 ·  Prompt templates
# -----------------------------------------------------------------------
HEADER = AGENTS_MD.read_text().strip()
PROMPT_DIR.mkdir(exist_ok=True)

TEMPLATE_API = textwrap.dedent("""\
{header}

---- TASK START ----
### Wire-up task (API): {operationId}

**method**           {method}
**path**             {path}
**todo stubs in FE** {todoCount}

**Scope**
1. Implement backend endpoint (DRF view/serializer) & WS echo if needed.
2. 🔧 *Front-end* – delete or replace every
   `// TODO backend-wire-up:{stubName}` in `libs/stream-chat-shim/src/`.
3. Regenerate OpenAPI & flip `"status":"ok"` in the manifest.
4. Ensure pytest + jest + lints pass.

Paste a single patch (multiple files welcome).
""")

TEMPLATE_SHIM = textwrap.dedent("""\
{header}

---- TASK START ----
### Shim helper task: {stubName}

**todo stubs in FE** {todoCount}

**Scope**
1. Extend or create **chatSDKShim.ts** so calls matching `{stubName}` resolve.
2. Run a codemod (jscodeshift / sed) to remove **all** matching
   `// TODO backend-wire-up:{stubName}` occurrences.
3. No backend changes expected – just unit tests & lint.

Paste a single patch (multiple files welcome).
""")

# -----------------------------------------------------------------------
# 3 ·  Render prompt files
# -----------------------------------------------------------------------
api_count, shim_count = 0, 0

for entry in manifest:
    kind = entry.get("ticketType", "shim")

    if kind == "api":
        fname = f"api_{entry['operationId']}.md"
        text  = TEMPLATE_API.format(header=HEADER, **entry)
        api_count += 1
    else:
        fname = f"shim_{entry['stubName']}.md"
        text  = TEMPLATE_SHIM.format(header=HEADER, **entry)
        shim_count += 1

    (PROMPT_DIR / fname).write_text(text)

print(f"✅ {api_count} API prompts  +  {shim_count} shim prompts →  {PROMPT_DIR}/")
