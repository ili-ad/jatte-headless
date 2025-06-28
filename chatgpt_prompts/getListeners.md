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

## 2 · Definition of Done

    HTTP endpoint & serializer behave per payload spec.

    WebSocket echo/event published where applicable.

    All // TODO backend-wire-up: <operationId> stubs deleted.

    Unit + integration tests green (./manage.py test & pnpm test).

    wireup_manifest.json entry flipped to "status": "ok".

    scripts/diff_openapi.py shows zero new gaps.

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

---- TASK START ----
### Wire-up task: getListeners

**method**          GET
**path**            /listeners/
**todo stubs in FE** 0

Please implement the backend slice described above following all rules in AGENTS.md.
