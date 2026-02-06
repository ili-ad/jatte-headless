'use client';

import type { Session } from '@supabase/supabase-js';

let lastSyncedToken: string | null = null;
let inFlight: Promise<void> | null = null;

export async function ensureAuthCookiesSynced(
  session: Session | null,
  opts?: { force?: boolean },
): Promise<void> {
  const accessToken = session?.access_token;
  const refreshToken = session?.refresh_token;

  if (!accessToken || !refreshToken) return;

  if (!opts?.force && accessToken === lastSyncedToken) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: session?.expires_at,
        }),
      });
    } catch {
      // swallow: caller decides what to do next
    } finally {
      lastSyncedToken = accessToken;
      inFlight = null;
    }
  })();

  return inFlight;
}
