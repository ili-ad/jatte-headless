# Supabase hub (library-owned)

This package hosts the upstream-ready Supabase hub used by `jatte-headless` UIs. The hub exposes a provider/context pair that owns a single browser client instance and auth subscription per tree, while allowing downstream hosts to inject their own Supabase configuration.

## Factory contract

Implement `SupabaseClientFactory` with at least one method:

```ts
interface SupabaseClientFactory {
  createBrowserClient(): SupabaseClient
}
```

Pass a factory instance to `SupabaseHubProvider` to reuse the host's Supabase client wiring. The provider will default to an env-driven factory (reading `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) when no factory is supplied, keeping the upstream package runnable out-of-the-box.

## Provider and hooks

- `SupabaseHubProvider` mounts the browser client and a single `onAuthStateChange` subscription.
- `useSupabaseHub()` returns `{ client, session, setSession, status }` so spokes can read the client or session state without constructing their own clients.
- `useSupabaseClient()` and `useSupabaseSession()` are convenience hooks layered on top of the hub.

## Non-React call sites

Modules that are not React-aware (e.g., token fetch utilities) can call `getSupabaseBrowserClient()`; the provider will register the injected factory so these utilities reuse the same client instance.

## Integration checklist for downstream hosts

1. Create a factory that builds your Supabase browser client (and optionally server variants for future use).
2. Wrap the `jatte-headless` UI subtree in `SupabaseHubProvider`, passing the factory.
3. Replace direct Supabase imports in your app-level code with the hub hooks or `getSupabaseBrowserClient()`.

This keeps the library portable and prevents deep relative imports into host apps.
