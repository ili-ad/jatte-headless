# Agents – Ground Rules for This Repo

This document is for coding agents working on this codebase. It explains the
project layout, what is **read-only**, what is **safe to edit**, and what we
**prefer you to touch first** when making changes.

The goal is to keep this repo compatible with upstream libraries (especially
Stream UI) while still giving us room to customize behavior for this project.

---

## 1. Repo layout (very high level)

At the root you’ll see three main areas:

- `frontend/` – Next.js / React app for the Notice to Owner (NTO) site.
- `backend/` – Django backend (API, agents, RAG, etc.).
- `libs/` – External or shared libraries, including our Stream adapters.

Inside `libs/`:

- `libs/chat-shim/` – Thin compatibility shim around our chat client state.
- `libs/stream-chat-shim/` – The read-only `@iliad/stream-chat-shim` submodule,
  pinned to the Iliad downstream Stream fork. Its GetStream ancestry and
  upgrade process are documented in that repository's `UPSTREAM.md`.
- `libs/stream-value-shim/` – Small helper shim for value types.

---

## 2. Read-only vs writable zones

### Strictly read-only

These directories must not be edited by agents:

- `libs/stream-chat-shim/**`
- `node_modules/**` (anywhere)
- Any generated bundles / `dist` output.

Reason: we want to be able to pull updates from upstream Stream UI and other
dependencies without merge conflicts or losing track of local hacks.

If you think there is an upstream bug, document it (e.g. in `audit/`) and
propose a workaround in our own code rather than editing vendor code.

### Writable (but with priorities)

**Highest-priority / preferred places to make changes:**

- `frontend/**`
  - All app-specific UI logic, message rendering, and Agent Lab UX should go
    here *first*.
  - If you can solve a problem by adding a custom component, wrapper, or
    configuration in `frontend/` rather than modifying shims, do that.
- `backend/**`
  - Django models, views, agent orchestration, RAG, management commands, etc.

**Writable but “use sparingly” / generic:**

- `libs/chat-shim/**`

This shim is intended to be **reusable across multiple projects**. You *may*
modify it when necessary, but:

- Prefer solving project-specific behavior in `frontend/` first.
- When you change a shim, think in terms of *generic adapter behavior*, not
  NTO-specific UI quirks.
- Keep changes minimal, well-documented, and tested.

---

## 3. Stream / chat customization rules of thumb

When working on chat/agent features (e.g. streaming, AI indicators, RAG UI):

1. **Do not** edit `libs/stream-chat-shim/src/**` in Jatte.
   Instead:
   - Use the customization hooks exposed by Stream UI (Message renderer,
     MessageList overrides, etc.) **via** `stream-chat-shim` and `frontend`.
2. **Prefer `frontend/` for UI changes**:
   - Want to add a “ⓘ Based on 5 sections from our lien library” line under
     agent messages?
     - Write a custom message component in `frontend/` and pass it as a
       renderer/override.
   - Want different labels for anonymous users (e.g. `Guest B531`)?
     - Implement that formatting in the frontend message component.
3. **Use the shims only for protocol / plumbing changes**:
   - Example: bridging WebSocket event types (`message.new`,
     `ai_indicator.update`) into the Stream Chat client.
   - Example: normalizing backend `custom_data.ai_state` into a local enum.

If you’re unsure whether something belongs in `frontend` vs `stream-chat-shim`,
favor `frontend` and/or write a short note in `audit/` explaining your chosen
extension point.

---

## 4. Logging & audit conventions

- Backend logs:
  - We use `logger.info("agent.rag.result ...")`, `agent.llm.*`, etc. in
    `backend/chat_addons/agent/**`. These are safe to extend for observability.
- Audit docs:
  - Use `audit/*.md` to capture architectural findings, message flows, etc.
  - E.g. `audit/agent-lab-ws-flow.md`, `audit/agent-message-rendering.md`.

If you need to explore the architecture before coding, prefer a “plan” task that
writes or updates a markdown file in `audit/` rather than guess-editing code.

---

## 5. Quick summary for agents

- ✅ **Edit freely:** `frontend/**`, `backend/**`, audit docs, tests.  
- ⚠️ **Edit sparingly (prefer generic changes):** `libs/chat-shim/**`.
- ⛔ **Do NOT edit:** `libs/stream-chat-shim/**`, `node_modules/**`, generated
  bundles.

- For chat/agent UI work, prefer:
  1. New components / overrides in `frontend/`.
  2. Only if necessary, small, reusable adaptations in `libs/chat-shim`.

Generic Stream-derived changes are made in `ili-ad/iliad-stream-chat-react`;
Jatte advances the reviewed submodule pin. Jatte-specific adapter and
application behavior stays here.


---

## 6. Security review and hardening lane

This repository is also undergoing a security hardening pass for the Django/DRF/Channels backend that emulates the subset of Stream Chat used by the JATTE frontend.

Security-hardening priorities:

- Preserve frontend compatibility with the existing Stream Chat React client usage.
- Prefer small, test-backed patches over broad rewrites.
- Treat authentication, channel membership, WebSocket subscriptions, attachments, CORS/CSRF, and event delivery as high-risk areas.
- Do not rename public API routes or response fields unless tests and migration notes are provided.
- Do not introduce external managed chat services.
- When reviewing security work, classify findings as must-fix, should-fix, tests-needed, or defer.
