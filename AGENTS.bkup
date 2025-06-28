# AGENTS.md  – Wire-up playbook
# =============================================================

## 0 · Context
We forked **stream-chat-react** (now `libs/stream-chat-shim/`) so it can talk to our own Django 5 backend instead of Stream’s SaaS.

Key code locations:
| Concern | Path |
|---------|------|
| **Auth glue** (Supabase JWT → Django `request.user`) | `backend/accounts_supabase/views.py` |
| **Chat API** (all HTTP + WS fan-out lives here) | `backend/chat/api_views.py` |
| **Frontend shim** (TSX components & hooks) | `libs/stream-chat-shim/src/` |

The file **`wireup_manifest.json`** lists every missing endpoint.  
Each task payload you get will look like:

```json
{
  "method": "POST",
  "path": "/attachments/",
  "operationId": "uploadAttachment",
  "status": "missing",
  "todoCount": 12
}
```
## 1 · Coding conventions
| Area            | Guideline                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Backend**     | Django 5 + DRF, class-based views preferred. Black + isort must pass.                           |
| **WebSockets**  | Use `channels.layers.get_channel_layer()` and group name `channel_<uuid>`.                      |
| **Frontend**    | TS 5.4, React 19, Next 15 (app router). ESLint/Prettier must pass.                              |
| **Tests**       | pytest + pytest-django; jest/RTL for TS. 100 % new code covered.                                |
| **OpenAPI**     | After code, run `scripts/gen_openapi.sh` to refresh `backend-openapi-spec.yml`.                 |
| **Migrations**  | If a task needs schema, add `needs_migration=true` to payload & create a single migration file. |
| **Branch name** | `wireup/<operationId>` (e.g. `wireup/uploadAttachment`).                                        |
| **Commit msg**  | Conventional Commits, prefix with opId, e.g. `feat(uploadAttachment): implement`                |


## 2 · Definition of Done  (backend **and** frontend)
**Backend**
  1. HTTP handler + serializer implemented per payload spec.
  2. WS event emitted where required.
  3. OpenAPI regenerated (`scripts/gen_openapi.sh`) and diff is clean.

**Front-end wiring**
  4. Delete or replace *every* matching  
     `// TODO backend-wire-up:{operationId}` in `libs/stream-chat-shim/src/`.
     - Prefer a thin typed wrapper in `chatAPI.ts` so future calls can’t regress.
     - Add/adjust optimistic-update logic if relevant (`sendMessage`, etc.).

**Quality gates**
  5. Jest + pytest suites green.
  6. `rg -q "backend-wire-up:{operationId}" libs/stream-chat-shim/src || true`  
     must return **non-zero** (no remaining stubs) — CI fails otherwise.
  7. Commit flips `status` → `"ok"` for this entry in `openapi/wireup_manifest.json`.

## 3 · Merge-safety / parallelism

    One PR must touch only one operationId.

    Do not refactor unrelated files. If hygiene fix is needed, open a follow-up PR.

    Before push: pnpm lint:fix && black . && isort ..

## 4 · Style nits

    Prefer early returns; avoid deep nesting.

    Add docstring on public Python functions.

    TypeScript: keep generics explicit; never silence TS with any (use generics or utility types).

## 5 · Forbidden

    New dependencies without approval.

    Hard-coding Stream secrets.

    Changing default auth flow (Supabase JWT) unless payload says so.

=============================================================