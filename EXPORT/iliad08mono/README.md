# Iliad08Mono export cartridge

This folder contains starter stubs for Iliad-specific RAG prompts and sidecar
catalogs. Copy them into the host repo and wire them up via settings.

## Backend wiring

1. Copy `backend/rag_prompt_iliad_stub.py` and `backend/sidecar_defs_iliad_stub.py`.
2. Configure settings/env:

```python
AGENT_RAG_PROMPT_BUILDER = "path.to.rag_prompt_iliad_stub.build_rag_system_prompt_iliad"
AGENT_SIDECAR_DEFS_PROVIDER = "path.to.sidecar_defs_iliad_stub.get_sidecar_defs_iliad"
```

## Frontend wiring

Optional: use `frontend/AgentMessageIliad.tsx` as a starting point for branded
copy in the chat UI.
