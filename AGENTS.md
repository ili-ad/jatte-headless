# Agents backlog – **Phase 0 (MVP chat)**

> One ticket ≈ 100 LOC. Mark ✅ when merged into `main`.

| ID  | Description                                                                           | Owner | Status |
|-----|---------------------------------------------------------------------------------------|-------|--------|
| 0A  | Ensure backend & frontend deps installed (see checklist)                              | human | ✅ |
| **B1** | **Implement `ChatConsumer`** – connect/ disconnect, `channel.watch`, `sendMessage`; persist `Message`; broadcast `message.new`; includes pytest (`chat/tests/test_websocket.py`). | Codex | ☐ |
| F1  | `getToken.ts` hit `/api/token` (stub OK)                                              | Codex | ☐ |
| F2  | `ChatProvider` connects user with **dummy** token                                     | Codex | ☐ |
| F3  | `/demo` page renders `<Chat><Channel><Window><MessageList/><MessageInput/></Window></Channel></Chat>` | Codex | ☐ |
| S1  | Manual smoke-test instructions (curl + WS)                                           | human | ✅ |
| S2  | **Auth-less harness** – set RoomListCreate `AllowAny`; fixture disables auth in tests | human | ☐ |
| S3  | **Re-enable JWT auth & update tests** at Phase 1 kickoff                              | human | ☐ |

**Phase 0 is done** (“Dave Matthews → hello world”) when every ☐ above is ✅.

---

## Phase 0 implementation ticket (for Codex)

* **Target branch:** `feat/phase0-chat`  
* **Touch files:** `chat/consumers.py`, `chat/routing.py`, `chat/tests/test_websocket.py`  
* **Assumptions:** SQLite dev DB, auth _disabled_ (`AllowAny`), room already exists via `POST /api/rooms/`.  
* **Acceptance:** pytest passes – create room → WS connect → `channel.watch` → `sendMessage` → receive `message.new`.
