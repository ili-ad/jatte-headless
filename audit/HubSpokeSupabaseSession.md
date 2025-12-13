# Ticket 1: Codex spider ticket (repo mapping + fix plan)

## Title

Eliminate cross-boundary Supabase imports: map and refactor Supabase client/auth initialization to a single injectable hub (apps/next) with reusable spokes (libs/jatte-headless)

## Context

Repo topology (as currently observed):

- Host app: `frontend` (Next.js app; houses current Supabase wiring under `src/lib`).
- No vendored `libs/jatte-headless` subtree is present in this checkout; Supabase touchpoints live under `frontend/src/**`.
- `apps/` currently contains `apps/web` (no Supabase references found).

## Deliverable 1: Inventory table

| File path | Client component? (`'use client'`) | How it obtains Supabase client | Session/auth subscription present? | Used by | Notes |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/lib/supabaseClient.ts` | No | Creates client via `createClient(url, key)`; module-level singleton with optional `setSupabaseClient` injection | No | Imported by `login/page.tsx`, `SessionProvider`, `getToken`, `getChatCreds` | Acts as de facto hub; singleton enforced by module-level `injected` variable; env vars required for default creation. |
| `frontend/src/lib/SessionProvider.tsx` | Yes | Imports `getSupabaseClient()` from `supabaseClient` | Yes; `auth.getSession()` on mount + `onAuthStateChange` subscription | Imported by `frontend/src/app/layout.tsx`; `useSession` consumed by `ChatGuard`, `ChatProvider`, and `login/page.tsx` | Primary subscription site; unmount cleans up listener. |
| `frontend/src/app/login/page.tsx` | Yes | Imports `getSupabaseClient()` | No subscription; performs `auth.signInWithPassword` | Route component under `/login`; uses `useSession` to stash session in context | Auth flow runs on client; assumes `SessionProvider` above in tree. |
| `frontend/src/lib/getChatCreds.ts` | No | Imports `getSupabaseClient()` | No subscription; reads `auth.getSession()` | Called by `ChatProvider` | Fetches backend token with Supabase access token; also calls `setAuthToken` for Stream shim. |
| `frontend/src/lib/getToken.ts` | No | Imports `getSupabaseClient()` | No subscription; reads `auth.getSession()` | Currently not referenced elsewhere (no imports found) | Duplicates token-fetch pattern used by `getChatCreds`; potential for consolidation. |

Cross-boundary imports: none found (no `libs/**` file imports from `apps/**`, and no `../../../../apps/...` patterns surfaced).

## Deliverable 2: Dependency graph narrative

- **Current hub**: `frontend/src/lib/supabaseClient.ts` owns the Supabase browser client. It memoizes a single instance via `injected` and allows an external caller to seed it via `setSupabaseClient` (though no caller presently injects one).
- **Spokes**:
  - `SessionProvider` uses the hub to hydrate session state and subscribe to auth changes, exporting `useSession` for the rest of the app.
  - `login/page.tsx` pulls the hub client to perform password sign-in and updates context via `setSession`.
  - `getChatCreds` and `getToken` pull the hub client to read the current session and trade the Supabase access token for app-specific tokens.
- **Duplication risk**:
  - If a vendored `libs/jatte-headless` subtree reintroduces its own Supabase client factory, it could bypass the `setSupabaseClient` singleton and create parallel clients. The absence of an explicit injection contract means downstream hosts might deep-import each other (as noted in the ticket) to avoid duplication.
  - Only one auth subscription is currently mounted (`SessionProvider` in `app/layout.tsx`), so duplication today would come from multiple client factories, not multiple providers.

## Deliverable 3: Refactor proposal (ranked options)

**Option A (preferred): Dependency Injection via library-owned context/provider**
- **What changes**: Move the session/provider logic into the vendored library (`libs/jatte-headless`), exporting a `SupabaseClientProvider` (or reuse `SessionProvider`) that accepts a client instance or factory. Provide `useSupabaseClient` / `useSession` hooks.
- **Host integration**: Host app (e.g., `apps/next` or current `frontend`) wraps subtree UI once and passes its hub client (created in host). Upstream standalone repo can default to an internal factory when no client is supplied.
- **Pros**: Eliminates deep imports, centralizes subscription, keeps tree-shakable hooks, works in both standalone and vendored layouts. Encourages single client instantiation.
- **Cons**: Requires touching multiple call sites to accept injected client and re-export hooks; must ensure SSR-safe default factory.

**Option B: Module alias adapter contract**
- **What changes**: Library files import from a stable specifier (e.g., `@jatte/supabase/browserClient`). Host apps map this alias in `tsconfig`/Next config to their local client implementation (`apps/next/src/lib/supabase/browserClient` or `frontend/src/lib/supabaseClient`).
- **Pros**: Keeps library code free of relative host paths; host controls implementation; minimal runtime changes.
- **Cons**: Requires alias wiring in both standalone and monorepo builds; mistakes in aliasing cause build-time errors rather than graceful defaults; still need to guard against multiple provider mounts.

**Option C: Global setter**
- **What changes**: Expose `setSupabaseBrowserClientFactory(() => SupabaseClient)` / `getSupabaseBrowserClient()` utilities in the library. Host calls the setter once; library callers always go through the getter.
- **Pros**: Simple API; no React context required for client access.
- **Cons**: Must carefully avoid SSR leakage; less ergonomic for hooks needing session data; still need a single place to mount auth subscription (likely a companion provider), so this alone is insufficient.

## Deliverable 4: Patch plan + implementation outline

1. **Establish hub provider in library** (Option A):
   - Create `libs/jatte-headless/frontend/src/lib/SupabaseProvider.tsx` (or rename existing `SessionProvider`) that accepts an optional `client` prop or factory. Default to library-local client factory for upstream standalone use; in monorepo host, pass the host-created client.
   - Export hooks `useSupabaseClient` and `useSession` so downstream code no longer imports host-specific modules.
2. **Refactor spokes to use injection**:
   - Update `frontend/src/lib/getChatCreds.ts`, `getToken.ts`, `login/page.tsx`, and any additional auth consumers to pull the client via the provider hook instead of direct imports. Ensure they handle undefined clients gracefully.
   - Keep a single `onAuthStateChange` subscription inside the provider; remove any duplicate subscriptions if more exist in the vendored subtree.
3. **Remove cross-boundary imports**:
   - Replace any deep relative imports into `apps/**` with either the provider hook (Option A) or the module alias (Option B). Add `paths` mapping in `tsconfig`/Next config if Option B is chosen.
4. **Document integration**:
   - Add a short README snippet describing how hosts should supply the Supabase client when vendoring `libs/jatte-headless`, and how standalone usage falls back to the default factory.
5. **Verification**:
   - Ensure only one client instance is created (memoized in the provider) and only one auth subscription is mounted (the provider). Validate navigation/auth flows in both standalone (`frontend`) and vendored contexts.

### Proposed README snippet

> **Using jatte-headless with your Supabase client**
> 1. Create your Supabase browser client in the host app (e.g., `apps/next/src/lib/supabase/browserClient.ts`).
> 2. Wrap the jatte-headless UI with `SupabaseClientProvider` and pass your client instance or factory.
> 3. Use `useSupabaseClient()` / `useSession()` inside the subtree instead of importing the host client directly. The provider ensures only one client and one auth subscription run per browser session.

