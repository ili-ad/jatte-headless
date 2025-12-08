# Next.js Frontend Survey – Reusable vs Demo

## 1. Project detection & assumptions
- **Next app root:** `frontend/` with `next.config.ts`, `package.json`, and app router entry at `frontend/src/app` (uses `layout.tsx`/`page.tsx`, so Next.js App Router).
- **Version hints:** Next 15.3 in `package.json`; imports `Metadata` type and `app/` structure confirm App Router. Webpack aliases point at in-repo chat shims (Stream chat + custom adapters).
- **Assumptions:** Only the `frontend/` Next app is in scope; Django backend exists but not analyzed. `libs/stream-ui` is vendor/readonly; functionality comes from adapters in `frontend/src/lib/stream-adapter` and `libs/stream-chat-shim`.

## 2. Next app structure overview
```
frontend/
  src/
    app/                 // App-router pages: chat demos, agent sandbox, admin, login
    components/          // Minimal UI primitives and auth guard
    config/              // Endpoint configuration (API/WS base)
    lib/                 // Chat providers, adapters, Supabase session handling, APIs
      stream-adapter/    // Custom Stream-like client/channel for backend
      chat-addons/       // Agent + admin API helpers
    stream-chat-react-shim.ts // (commented) placeholder patch
  shims/                 // Micromark decoding shim
  stubs/                 // Stream UI stubs for builds
  types/                 // Ambient type shims for chat packages
```
- `src/app`: Pages for `/`, `/login`, `/demo`, `/chat`, `/agent`, `/chat-admin`; global layout wires session/auth bootstrap and endpoint config.
- `src/lib`: Core chat wiring (ChatProvider, ChatUI), backend API helpers, Supabase session bridge, Stream-like adapter, agent/admin APIs, sidecar catalog.
- `src/components`: `ChatGuard` auth gate + basic `Button` primitive.
- `shims`/`stubs`/`types`: Support tooling for package resolution and build compatibility.

## 3. Route & page map (demo vs reusable consumers)
| Route | Files | Purpose | Classification | Key imports (lib/components/hooks) | Reusable pieces |
|-------|-------|---------|----------------|------------------------------------|-----------------|
| `/` | `src/app/page.tsx` | Default Next starter splash. | demo-page | None beyond Next assets. | None. |
| `/login` | `src/app/login/page.tsx` | Supabase email/password login; redirects to `/demo`. | app-page | `supabaseClient`, `SessionProvider` hook. | `useSession` setter + Supabase client reusable; UI is minimal. |
| `/demo` | `src/app/demo/page.tsx` | Simple chat demo that auto-sends “hello world” once channel ready. | demo-page | `ChatProvider`, `useChat`, `ChatUI`, `ChatGuard`. | `ChatProvider`, `ChatUI` reusable; demo auto-send is not. |
| `/chat` | `src/app/chat/page.tsx` & `ChatInner.tsx` | Browser-only chat shell for arbitrary room (defaults to `general`). | app-page | `ChatProvider`, `ChatUI`, `ChatGuard`. | Provider/UI reusable; page wrapper is thin. |
| `/agent` | `src/app/agent/page.tsx`, `AgentMessage.tsx`, `AgentAIStateBanner.tsx` | Agent sandbox targeting `agent-lab` room; custom message rendering with RAG/sidecar suggestions. | demo-page | `ChatInner` (from `/chat`), `AgentMessage`, `sidecarCatalog`, router; channel events. | `AgentMessage`/`AI banner` tied to agent demo and sidecar catalog. |
| `/chat-admin` | `src/app/chat-admin/page.tsx` | Admin console for queue management, agent toggling/invocation, links to demo room. | demo-page | `chat-addons/adminApi`, `chat-addons/agentApi`, `toast`. | APIs could be reused; UI is admin-specific. |
| `layout`/bootstrap | `src/app/layout.tsx`, `AuthBootstrap.tsx`, `endpoint-config.tsx`, `Providers.tsx` (commented) | Global CSS, Stream shim CSS, session provider, auth token bootstrap for chat shim, endpoint configuration. | infra-page | `SessionProvider`, `setAuthToken`, endpoint config functions. | Session provider & endpoint config reusable; bootstrap fetch path is app-specific.

## 4. Libraries: `src/lib` survey
- **ChatProvider (`src/lib/ChatProvider.tsx`)** – Connects Supabase-authenticated user to custom ChatClient, opens Channel, watches config, marks read. Exports `useChat`. **Classification:** core-chat-logic with transport coupling (Stream-like adapter + Supabase token fetch). Depends on `getChatCreds`, `getStreamClient`, `stream-adapter` Channel/ChatClient, `SessionProvider`.
- **ChatUI (`src/lib/ChatUI.tsx`)** – Assembles chat UI using `@iliad/stream-chat-shim` components, injects custom `AgentMessage`, AI indicators, stop button, logging. **Classification:** core chat UI but agent/demo flavored (AI controls, debug logging).
- **API helpers (`src/lib/api.ts`, `errors.ts`)** – Fetch wrapper that injects chat JWT and handles auth toasts; defines `AuthError`. **Classification:** generic-utils with chat coupling via shared client JWT.
- **Session handling (`src/lib/SessionProvider.tsx`, `supabaseClient.ts`)** – Supabase session context/provider. **Classification:** generic-utils (auth plumbing) but Supabase-specific.
- **Token/cred helpers (`src/lib/getChatCreds.ts`, `getToken.ts`)** – Fetch token from backend `/api/token/`, set auth token in chat shim. **Classification:** chat-transport tied to backend API.
- **Sidecar catalog (`src/lib/sidecarCatalog.ts`)** – Static definitions for agent sidecar suggestions. **Classification:** demo-only data/model.
- **Chat adapter (`src/lib/stream-adapter/*`)** – Custom Stream-like client/channel with WebSocket, API calls, AI state tracking, composer, attachment manager stubs, token manager, intro message helpers, constants, types. **Classification:** agent-plumbing + chat-transport; intended reusable shim for backend compatibility.
- **Chat add-ons (`src/lib/chat-addons/agentApi.ts`, `adminApi.ts`)** – REST helpers for agent enable/invoke, admin queue, claims. **Classification:** agent-plumbing/demo-support; transport-specific to backend endpoints.
- **Other (`src/lib/ErrorBoundary.tsx`)** – Catches `AuthError` to trigger `ChatGuard`. **Classification:** generic-utils with chat-auth coupling.

External dependencies: relies on `@iliad/stream-chat-shim` for UI components/AI hooks, Supabase auth, backend REST at `/api/*` configured via endpoint config; WebSocket base from config/env shim.

## 5. Shims & adapters
- **Webpack aliases (`next.config.ts`)** redirect `stream-chat-react`, `@iliad/stream-chat-shim`, and `chat-shim` to in-repo adapters; also aliases `decode-named-character-reference` to local shim. Target: force UI to use custom adapters. **Classification:** essential-shim.
- **`shims/decode-named-character-reference.js`** – micromark-compatible decoder export for markdown parsing. Imported via alias when needed. **Classification:** essential-shim.
- **`src/lib/stream-adapter/*`** – Acts as adapter between Stream UI expectations and Django backend APIs/WebSocket. Imported by ChatProvider/ChatUI and any page using chat. **Classification:** essential-shim (core to reusable chat kit).
- **`src/stream-chat-react-shim.ts` (commented)** – Prototype patch for TextareaComposer fallback; currently inert. **Classification:** demo-shim/migration placeholder.
- **`stubs/stream-ui/*` & `types/stream-ui-shim.d.ts`** – Build-time stubs for Stream UI; not used at runtime when real package available. **Classification:** demo-shim/build-only.

## 6. Types & models
- **`src/lib/stream-adapter/types.ts`** – Defines `Room`, `Message`, `AppSettings`, `User`, and `ChatEvents` payloads; used across adapter. **Classification:** shared-types (domain-level) with transport flavor.
- **`src/lib/chat-addons/agentApi.ts`** – Types for agent toggles, invocations, replies, room agent config. **Classification:** transport-types for backend agent endpoints.
- **`src/lib/chat-addons/adminApi.ts`** – Types for admin queue rows/responses. **Classification:** transport-types.
- **`src/lib/sidecarCatalog.ts`** – Sidecar definitions/suggestions. **Classification:** demo-types/fixtures.
- **Ambient type shims (`types/stream-chat-shim.d.ts`, `types/stream-ui-shim.d.ts`)** – Module declarations to satisfy TS when using shimmed packages. **Classification:** migration-bridge.

Types primarily flow through lib modules into pages (`AgentMessage` expects `SidecarItemDef`, `ChatUI` uses `LocalMessage` from chat shim). Pages rely on lib abstractions rather than defining their own types, except for admin/agent components that embed API types directly.

## 7. Components & hooks: reusable vs demo
- **Components**
  - `chat-ui`: `ChatUI` (uses Stream chat components + custom AgentMessage), `AgentMessage`, `AgentAIStateBanner`. Depend on chat channel context and agent metadata; tied to adapter + backend AI signals → mostly demo-specific with reusable kernels.
  - `shell-layout`: `ChatInner` (room wrapper), `ChatGuard` (auth gate/redirect), layout (`layout.tsx`) wiring SessionProvider/AuthBootstrap/EndpointConfig. Mostly reusable scaffolding, though AuthBootstrap fetch path is app-specific.
  - `ui-primitives`: `components/ui/button.tsx` basic styled button (reusable, no router deps).
  - `demo-only`: Home page template, auto “hello world” sender in `/demo`, admin console.
- **Hooks/contexts**
  - `useChat` from ChatProvider (chat-hook tied to adapter + Supabase). Reusable within chat-kit context.
  - `useSession` from SessionProvider (state-hook around Supabase). Reusable for apps that keep Supabase.
  - No standalone hook directory; most hooks are inline (`useEffect` etc.) within components/pages.

Dependencies on Next router appear in `ChatGuard` redirect and `AgentMessage` (for sidecar navigation); most core chat UI relies on props/context not router.

## 8. Classification summary
| Path | Role | Classification | Notes |
|------|------|----------------|-------|
| `src/lib/stream-adapter/` | Stream-compatible client/channel + stores | REUSABLE_CANDIDATE | Core shim required for chat-kit; transport-specific but genericized. |
| `src/lib/ChatProvider.tsx` | Connects Supabase auth to adapter channel | MIXED | Reusable pattern but hard-coded to Supabase token fetch + `/api/token/`. |
| `src/lib/ChatUI.tsx` | Chat window with agent-aware UI | MIXED | Depends on Stream shim + agent controls; could be parameterized to drop demo logging/AI banners. |
| `src/lib/api.ts` | Fetch wrapper injecting chat JWT | REUSABLE_CANDIDATE | Generic helper; only dependency is shared chatClient JWT. |
| `src/lib/chat-addons/*` | Agent/admin transport helpers | MIXED | Transport reusable; flows tied to backend endpoints. |
| `src/lib/sidecarCatalog.ts` | Agent sidecar definitions | DEMO_ONLY | Static demo data. |
| `src/components/ChatGuard.tsx` | Auth gate | REUSABLE_CANDIDATE | Minimal Supabase coupling; configurable redirect. |
| `src/components/ui/button.tsx` | Primitive button | REUSABLE_CANDIDATE | Pure UI helper. |
| `src/app/chat`, `src/app/demo`, `src/app/agent`, `src/app/chat-admin` | Top-level pages | DEMO_ONLY | Consumer UIs; good references but not exported. |
| `shims/`, `stubs/`, `types/` | Build/runtime shims | MIXED | decode shim essential; Stream UI stubs demo-build-only. |

## 9. Proposed “public surface” for a future chat-kit
- **Provider & context**: `ChatProvider` and `useChat` (`src/lib/ChatProvider.tsx`) – would need injection of auth/token strategy instead of direct Supabase fetch.
- **Chat client factory**: `getStreamClient` (`src/lib/getStreamClient.ts`) and exported `ChatClient`/`Channel` (`src/lib/stream-adapter`) – expose as adapter creation utilities; ensure API/WS bases configurable via endpoint config or params.
- **UI widgets**: `ChatUI` (`src/lib/ChatUI.tsx`) and `AgentMessage` (`src/app/agent/AgentMessage.tsx`) – wrap into composable chat window; parameterize AI/sidecar behaviors to allow non-agent usage.
- **Auth/session plumbing**: `SessionProvider`/`useSession` (`src/lib/SessionProvider.tsx`) and `ChatGuard` (`src/components/ChatGuard.tsx`) – optionally export as Supabase-specific helpers; consider abstract auth interface for library.
- **API helpers**: `apiFetch`, `errors.AuthError` (`src/lib/api.ts`, `src/lib/errors.ts`) – keep as transport utilities with pluggable token getter; could move under kit namespace.
- **Agent/admin clients**: `chat-addons/agentApi.ts`, `adminApi.ts` – expose as optional modules for agent-enabled deployments.
- **Type exports**: `stream-adapter/types.ts`, agent/admin types – form the shared model layer for consumers.
- **Shims**: `decode-named-character-reference` and WebSocket/API base configurators (`endpoint-config.tsx`) – surface configurables rather than hard-coded environment reads.

Each candidate may need light refactoring (e.g., remove direct `fetch('/api/token/')`, allow caller-provided auth token, strip console logging) to be library-ready.

## 10. Risks, surprises, and recommended next steps
- **Supabase coupling:** ChatProvider and login guard assume Supabase session + `/api/token/`; extract token-provider interface to make kit portable.
- **Agent-specific UI baked into ChatUI:** AI state banner, stop button, AgentMessage render; parameterize or split into agent vs generic bundles.
- **Adapter surface breadth:** `stream-adapter/Channel` implements many Stream behaviors (composer, attachments, AI state, WS). Document public methods and stabilize API before vendoring.
- **Shims/stubs maintenance:** ensure aliases remain consistent when packaging; verify decode shim required in target environment.

**Next steps:**
1) Add `src/chat-kit` re-export layer for reusable modules (ChatProvider, ChatUI, ChatClient/Channel, apiFetch, types) with minimal agent/demo code. 
2) Introduce auth/token provider interface and configuration object (API/WS base) to decouple from Supabase + hard-coded endpoints. 
3) Separate agent/admin demo components into optional packages; make ChatUI accept render props for message components + AI controls. 
4) Harden adapter documentation/tests to confirm compatibility with `@iliad/stream-chat-shim` updates.
