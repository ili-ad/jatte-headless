# Skills Addendum — placement, naming, testing (CHAT-SCOPED)

**Placement**
- Put each skill under `backend/chat_addons/agent/skills/<pkg>/skill.py`
  - e.g., `skills/smalltalk/skill.py`, `skills/utility/skill.py`, `skills/echo/skill.py`
- Pure business logic only; no direct DB writes unless the ticket explicitly says so.
- Any side-effect (booking, writes) must call a domain interface in `backend/chatcore/services.py`.

**Naming**
- Each skill has a **globally-unique dotted name**: e.g., `smalltalk.greet`, `utility.time_now`, `utility.calc`.
- Keep names stable; description <= 140 chars (used in tool definition later).

**Schema**
- Keep `input_schema` / `output_schema` minimal JSON schemas (or TypedDict) with **deterministic** output.
- Validate inputs in `execute`; return structured errors via `{"error": {...}}` (do not raise).

**Discovery & flags**
- Skills are discovered by the registry from `backend/chat_addons/agent/skills/**/skill.py`.
- Per-room flags live in `AgentRoomPolicy.enabled_skills` (strings = skill names).

**Testing**
- Each skill includes unit tests under `backend/chat_addons/agent/tests/skills/test_<name>.py`.
- No network calls in tests. Seed deterministic clock for time-based utilities.

**Observability**
- Log a single structured line per `execute` with `{request_id, cid, skill, ok, latency_ms}` at INFO.

**WS & UI**
- No new WS event types. Skills **do not** talk to WS; the agent orchestrator will turn tool results into a normal message later.
