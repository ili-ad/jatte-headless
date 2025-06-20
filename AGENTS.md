# Agents backlog – **Phase 0 (MVP chat)**

> One ticket ≈ 100 LOC. Mark ✅ when completed. Human will merge onto main.

| ID  | Description (≤ LOC)                                                                                                                         | Owner | Status |
|-----|---------------------------------------------------------------------------------------------------------------------------------------------|-------|--------|
| 0A  | Ensure backend & frontend deps installed (pip/pnpm; Redis running)                                                                          | human | ✅ |
| B1  | **ASGI bootstrap (≈ 20)** – `asgi.py` → `ProtocolTypeRouter`; add empty `chat/routing.py`                                                   | Codex | ✅ |
| B2  | **Channel layer config (≈ 5)** – add `CHANNEL_LAYERS` Redis settings in `settings.py`                                                        | Codex | ✅ |
| B3  | **Models: Channel & Message (≤ 80)** – minimal fields; migrations                                                                           | Codex | ✅ |
| B4  | **JWT token endpoint (≈ 40)** – DRF Simple-JWT at `/api/token/`                                                                              | Codex | ✅ |
| B5  | **WebSocket consumer skeleton** – connect / disconnect / `receive_json` dispatcher *(implemented in PR #12)*                                 | Codex | ✅ |
| B6  | **Command: channel.watch** – create/fetch channel, group add, return `initialized` payload *(implemented in PR #12)*                        | Codex | ✅ |
| B7  | **Command: sendMessage** – persist message, broadcast `message.new` *(implemented in PR #12)*                                               | Codex | ✅ |
| B8  | **Command: markRead & countUnread (≈ 80)** – per-user read tracking                                                                         | Codex | ✅ |
| B9  | **Backend unit tests** – `channels.testing.WebsocketCommunicator` *(implemented in PR #12)*                                                  | Codex | ✅ |
| F1  | **Env & SDK wrapper (≈ 20)** – `.env.local`; `lib/getStreamClient.ts` memoises `StreamChat.getInstance(...)`                                | Codex | ✅ |
| F2  | **Token fetch utility (≈ 30)** – `lib/getToken.ts` hits `/api/token` and returns `{userID,userToken}`                                       | Codex | ✅ |
| F3  | **ChatProvider (≈ 40)** – React Context; `client.connectUser(...)`; exports `{client, channel}`                                             | Codex | ✅ |
| F4  | **Default channel bootstrap (≈ 30)** – `client.channel("messaging","general").watch()`; save to context                                     | Codex | ✅ |
| F5  | **UI scaffold (≤ 50)** – `<Chat><Channel><Window><MessageList/><MessageInput/></Window></Channel></Chat>`                                   | Codex | ✅ |
| F6  | **Event logger + markRead (≈ 20)** – `channel.on("message.new", () => channel.markRead())`                                                  | Codex | ✅ |
| F7  | **Smoke-test page (≈ 10)** – Next route `/demo` mounts provider & scaffold; shows “hello world” round-trip                                  | Codex | ✅ |
| S1  | Manual smoke-test instructions (curl + WS)                                                                                                  | human | ✅ |
| S2  | Auth-less harness – set `AllowAny`; fixture disables auth in tests                                                                          | human | ✅ |
| S3  | Re-enable JWT auth & update tests at Phase-1 kickoff                                                                                        | human | ☐ |

**Phase 0 is done** (“Dave Matthews → hello world”) when every ☐ above is ✅.

---

## Phase 0 implementation ticket (for Codex)

* **Target branch:** `feat/phase0-chat`
* **Touch files:** `chat/consumers.py`, `chat/routing.py`, `chat/tests/test_websocket.py`
* **Assumptions:** SQLite dev DB, auth *disabled* (`AllowAny`), room already exists via `POST /api/rooms/`.
* **Acceptance:** pytest passes – create room → WS connect → `channel.watch` → `sendMessage` → receive `message.new`.
