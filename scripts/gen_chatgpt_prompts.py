#!/usr/bin/env python3
"""
Generate ChatGPT prompt files from wireup_manifest.json
-------------------------------------------------------

• Adds `todoCount` by reading `/tmp/todo_counts.txt`  (format:  operationId:count).
• Ensures AGENTS.md is included at the top of every prompt.
• Drops *.md files into chatgpt_prompts/  (creates the folder if missing).
"""

import json
import pathlib
import sys
import textwrap

# ---------------------------------------------------------------------------
# 0.  Resolve repo paths
# ---------------------------------------------------------------------------
ROOT = pathlib.Path(__file__).resolve().parents[1]          # project root
MANIFEST_PATH = ROOT / "openapi" / "wireup_manifest.json"
AGENTS_MD_PATH = ROOT / "AGENTS.md"
PROMPT_DIR = ROOT / "chatgpt_prompts"

# ---------------------------------------------------------------------------
# 1.  Sanity checks
# ---------------------------------------------------------------------------
if not MANIFEST_PATH.exists():
    sys.exit(f"❌ Manifest not found: {MANIFEST_PATH}")

if not AGENTS_MD_PATH.exists():
    sys.exit("❌ AGENTS.md not found at project root")

# ---------------------------------------------------------------------------
# 2.  Load manifest & optional todo-counts
# ---------------------------------------------------------------------------
manifest = json.loads(MANIFEST_PATH.read_text())

todo_counts_file = pathlib.Path("/tmp/todo_counts.txt")
todo_counts = {}
if todo_counts_file.exists():
    for line in todo_counts_file.read_text().splitlines():
        op_id, cnt = line.strip().split(":")
        todo_counts[op_id] = int(cnt)

# inject todoCount (default 0)
for entry in manifest:
    entry["todoCount"] = todo_counts.get(entry["operationId"], 0)

# persist enriched manifest
MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))

# ---------------------------------------------------------------------------
# 3.  Render prompts
# ---------------------------------------------------------------------------
AGENT_HEADER = AGENTS_MD_PATH.read_text().strip()
PROMPT_DIR.mkdir(exist_ok=True)

TEMPLATE = textwrap.dedent("""\
{header}

---- TASK START ----
### Wire-up task: {operationId}

**method**           {method}
**path**             {path}
**todo stubs in FE** {todoCount}

**Scope**
1. Implement backend endpoint & WS echo.
2. 🔧 **Front-end** – remove/re-wire every
   `// TODO backend-wire-up:{operationId}` in `libs/stream-chat-shim/src/`.
3. Regenerate OpenAPI + flip `"status":"ok"` in the manifest.
4. Ensure tests and lints pass.

Paste a single patch (multiple files welcome).
""")


for entry in manifest:
    prompt_file = PROMPT_DIR / f"{entry['operationId']}.md"
    prompt_file.write_text(TEMPLATE.format(header=AGENT_HEADER, **entry))

print(f"✅ Written {len(manifest)} prompt files → {PROMPT_DIR}/")
