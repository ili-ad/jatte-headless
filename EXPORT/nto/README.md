# NTO export cartridge

Copy the files in this folder into your host repo to restore the Florida-specific
runtime behavior (RAG prompt, sidecar catalog, and UI copy).

## Backend wiring

1. Copy `backend/rag_prompt_fl.py` and `backend/sidecar_defs_fl.py` into the
   host backend codebase.
2. Configure settings/env:

```python
AGENT_RAG_PROMPT_BUILDER = "path.to.rag_prompt_fl.build_rag_system_prompt_fl"
AGENT_SIDECAR_DEFS_PROVIDER = "path.to.sidecar_defs_fl.get_sidecar_defs_fl"
AGENT_RAG_STATE = "FL"
```

## Frontend wiring

1. Copy `frontend/sidecarCatalog.ts` if you still want a local catalog fallback.
2. Optional: replace the generic AgentMessage with the NTO copy variant if you
   want the original attribution line.

## Docs

See `docs/sample_ingestion_workflow.md` for the historical Florida ingestion
commands.
