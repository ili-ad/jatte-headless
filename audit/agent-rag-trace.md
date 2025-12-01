# Agent RAG trace (messaging:agent-lab)

## Endpoint wiring
- The frontend `invokeAgent` helper posts to `/chat/agent/${cid}/invoke/`, so the agent lab room hits `/api/chat/agent/<cid>/invoke/` on the backend. That URL is routed to `AgentLLMInvokeView` via `chat_addons/urls.py`.【F:frontend/src/lib/chat-addons/agentApi.ts†L83-L130】【F:backend/chat_addons/urls.py†L11-L29】
- `AgentLLMInvokeView.post` sets `meta` with `use_rag: True` and `state: "FL"` before calling `AgentService.generate`, so the RAG flags are present when the service begins orchestration.【F:backend/chat_addons/agent/views.py†L313-L334】
- `AgentRagView` exists at `/api/chat/agent/rag/` and also sets `use_rag: True`/`state: "FL"`, but the lab room path does not use it (only `requestAgentReply` would call it).【F:backend/chat_addons/urls.py†L18-L22】【F:backend/chat_addons/agent/views.py†L385-L456】【F:frontend/src/lib/chat-addons/agentApi.ts†L168-L191】

## RAG hook in `_orchestrate`
- RAG logic is gated by `meta_payload.get("use_rag")` after copying the incoming `meta`. It defaults `state` to `FL`, reads optional `rag_topic`/`rag_k`, embeds the user message via `embed_query`, and then runs `search_similar`. Any exception in embedding or retrieval is swallowed and simply returns `chunks = []`.【F:backend/chat_addons/agent/services/agent_service.py†L249-L268】
- When chunks are found, it builds a system prompt containing chunk headings/text and stores it in `meta_payload["rag_context"]` along with `rag_chunk_ids`.【F:backend/chat_addons/agent/services/agent_service.py†L270-L294】
- However, `_compose_messages` is called **before** this RAG block and is passed the original `meta` (without `rag_context`), so the composed `messages` never include the RAG system message. Later assigning `meta = meta_payload` does not recompose messages, meaning RAG context never reaches the LLM even when retrieval succeeds.【F:backend/chat_addons/agent/services/agent_service.py†L241-L296】

## Message composition
- `_compose_messages` would prepend `rag_context` as a system message if present, then append history and the user message. Because it is invoked before `rag_context` is inserted, the system prompt is skipped for all calls. No later step rebuilds `messages`, so LLM calls receive only history + user text.【F:backend/chat_addons/agent/services/agent_service.py†L241-L246】【F:backend/chat_addons/agent/services/agent_service.py†L311-L325】
- The meta dict passed downstream is updated with `rag_context`, but the LLM call only consumes the earlier `messages` list, so meta propagation alone cannot inject context.【F:backend/chat_addons/agent/services/agent_service.py†L295-L309】

## Retrieval correctness and durability
- `search_similar` uses the pgvector cosine operator `<#>` via `RawSQL` with `Vector(query_embedding)`; there is no branch for non-Postgres backends. On SQLite or Postgres without the extension, the query will raise and the `except Exception` block will silently drop RAG (empty chunks). There are two duplicate `search_similar` definitions; the latter overrides the former but has the same pgvector-only SQL path and no vendor guard.【F:backend/chat_addons/agent/services/vector_memory.py†L17-L86】【F:backend/chat_addons/agent/services/agent_service.py†L258-L268】
- Embeddings are expected to be 1536-dim `VectorField` entries matching `text-embedding-3-small`, so dimension mismatch is unlikely the cause.【F:backend/chat_addons/agent/models.py†L187-L194】
- There is no logging of retrieved chunk IDs or constructed `rag_context`, making it hard to confirm runtime RAG behavior in logs.【F:backend/chat_addons/agent/services/agent_service.py†L249-L296】

## Why answers are generic
- Endpoint wiring does set `use_rag`/`state` correctly, but `_compose_messages` runs before the RAG retrieval block and never sees `rag_context`. As a result, the LLM is called with only the user message (and any history) and no Florida context, so responses fall back to general knowledge (e.g., generic "NOC" or "commencement" definitions). Even if retrieval worked, the composed messages omit the context. Additionally, any retrieval/database error is silently swallowed, which would also yield empty context without a warning.【F:backend/chat_addons/agent/services/agent_service.py†L241-L309】【F:backend/chat_addons/agent/services/agent_service.py†L249-L268】

## Suggested fix points (not implemented)
- Move the `_compose_messages` call to **after** the RAG block (or re-compose once `rag_context` is added) so the system prompt is injected before calling the LLM.
- Add logging of `rag_chunk_ids`/`rag_context` creation and guard `search_similar` for non-pgvector backends instead of silently failing.
- If agent lab should use the dedicated RAG endpoint, adjust the frontend routing; otherwise ensure `AgentLLMInvokeView` stays the RAG-enabled path.
