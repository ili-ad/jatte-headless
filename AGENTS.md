
# Phase 0.5 – Supabase auth foundation

> One ticket ≈ 100 LOC. Mark ✅ when completed. Human will merge onto main.

| ID  | Description (≤ LOC)                                                                                                               | Owner | Status |
|-----|----------------------------------------------------------------------------------------------------------------------------------|-------|--------|
| A1  | **Install supabase-js & helper (≈20)** – `pnpm add @supabase/supabase-js`; add `src/lib/supabaseClient.ts`                        | Codex | ☐ |
| A2  | **Login page (≈50)** – email+password `/login`; stores `session` in context                                                       | Codex | ☐ |
| A3  | **DRF SupabaseJWTAuthentication (≈80)** – validate Bearer JWT via Supabase JWKS                                                   | Codex | ☐ |
| A4  | **Secure /api/token/ (≈40)** – requires Supabase auth; returns `StreamChat.devToken(user.id)`                                     | Codex | ☐ |
| A5  | **Token fetch hook (≈30)** – uses `supabase.auth.getSession()`; fetches `/api/token/` with auth header                            | Codex | ☐ |
| A6  | **ChatProvider update (≈20)** – connect/disconnect on session change, remove dev hacks                                            | Codex | ☐ |
| A7  | **Delete hard-coded USER_ID/TOKEN & WS URL (≈15)** – replace with env-vars or session props                                       | Codex | ☐ |
| A8  | **Playwright e2e: login → hello-world (≤100)** – fills login form, expects echo                                                   | human | ☐ |
| S3  | Re-enable JWT auth in unit tests, drop dummy `"jwt1"` tokens                                                                      | human | ☐ |

Phase 0.5 is complete when every ☐ above is ✅ and the e2e test passes.


**Phase 0.5 is done** (“Dave Matthews → hello world”) when every ☐ above is ✅.

---

## Phase 0.5 implementation ticket (for Codex)

* **Commit target:** `main`   <!-- solo-dev: no feature branches -->
* **Touch files (expected):**
  * `frontend/src/lib/supabaseClient.ts`
  * `frontend/src/app/login/page.tsx`
  * `frontend/src/lib/getToken.ts`                <!-- replaces dev helper -->
  * `frontend/src/lib/ChatProvider.tsx`
  * `backend/jatte/auth/supabase.py`              <!-- new DRF auth class -->
  * `backend/chat/views.py`                       <!-- secure `/api/token/` -->
  * **tests**  
    * `backend/chat/tests/test_supabase_auth.py`  
    * `frontend/tests/e2e/login-smoke.spec.ts`
* **Env assumptions:**

NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
NEXT_PUBLIC_WS_URL=ws://localhost:8000
SUPABASE_JWT_SECRET=super-secret
REDIS_HOST=localhost

SQLite dev DB; Redis running at `${REDIS_HOST}`.
* **Acceptance (CI must pass):**
1. **Unit tests**  
   * Valid Supabase JWT → `/api/token/` → `200 {userID,userToken}`  
   * Chat consumer echoes `message.new` when connected with that token.
2. **Playwright e2e**  
   * Fill `/login` with test creds → redirected to `/demo` → sees “hello world”.
3. No `AllowAny` outside Supabase login/signup views.
4. No hard-coded user IDs, tokens, or `localhost` strings remain in source.

> ✅ Merge to `main` when every checklist item above is green.
