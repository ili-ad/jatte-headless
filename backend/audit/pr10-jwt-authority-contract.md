# PR10 JWT authority and refresh contract

## Production route and caller inventory

| Route / operation | Effective implementation | Active caller | Before PR10 | PR10 contract |
| --- | --- | --- | --- | --- |
| `/refresh-token/` | `auth.views.RefreshTokenView`, inheriting `accounts_supabase.views.RefreshTokenView` | `ChatClient.refreshToken()` only | Locally minted indefinite HS256 token | Compatibility relay returning byte-for-byte `request.auth`, with `no-store`/`no-cache` |
| `/api/refresh-token/` | `accounts_supabase.views.RefreshTokenView` because `accounts_supabase.urls` precedes `auth.urls` | No separate active caller found | Same local mint | Same non-minting relay |
| `/api/token/` | `chat.views.TokenView` | `getChatCreds()` / `ChatProvider` bootstrap | Returned the validated incoming token as `userToken` | Unchanged pass-through bootstrap; never an issuer |
| `/api/ws-auth/` | `chat.api.ws_auth` | Adapter connection handshake | Minted a separate five-minute exp-only HS256 token | Relays the exact validated Supabase token in the legacy URL; never an issuer |
| `ChatClient.refreshToken()` | frontend Stream adapter | Stream-compatible client lifecycle | Called Django `/api/refresh-token/` through `apiFetch` | Calls Supabase JS 2.50.0 `auth.refreshSession()`, then validates/bootstrap-relays its access token through `/api/token/` |

`TokenManager.refreshToken()` had no caller other than `ChatClient.refreshToken()`.
No other active frontend component depends on Django minting a replacement JWT.
`AuthBootstrap` calls `/api/token/` without a bearer token and cannot mint or
refresh a credential.

## Authority and propagation

Supabase Auth is the sole issuer and refresher of browser user-session tokens.
JATTE validates access tokens and may relay the exact validated token for
Stream compatibility. A successful frontend refresh synchronizes
`ChatClient.jwt`, `ChatClient.authToken`, `TokenManager.token`, the shared
`authTokenStore`, and the stream-shim authorization token. REST, adapter,
channel, and newly opened WebSocket operations therefore use the same access
token.

HTTP and the active `ChatConsumer` WebSocket path both call
`decode_supabase_token`. HS256 accepts only the configured symmetric key;
RS256 accepts only the configured JWKS key. Both require and validate `sub`,
`exp`, `iat`, `iss`, and `aud` against `SUPABASE_JWT_ISSUER` and
`SUPABASE_JWT_AUDIENCE`, with the existing 30-second leeway. Tokens using any
other algorithm are rejected. User provisioning occurs only after this full
validation.

Production derives the issuer from an explicit `SUPABASE_JWT_ISSUER` or, as a
compatibility fallback, the configured Supabase project URL. Startup fails
closed if neither is available. The browser-user audience defaults explicitly
to `authenticated` and can be set with `SUPABASE_JWT_AUDIENCE`.

Old JATTE-minted tokens have no issuer, audience, issued-at, or expiry and are
intentionally rejected. They are not grandfathered or exchanged. Normal
browser bootstrap and refresh recover through the authenticated Supabase
session.
