import { toast } from 'sonner';
import { AuthError } from './errors';
import { chatClient } from './ChatProvider';   // ← adjust the path/name if needed

let lastToast = 0;

/**
 * Make a request to your Django backend.
 * – Automatically prefixes `/api`
 * – Injects the user’s Supabase JWT (once ChatProvider has it)
 * – Pops a toast and throws AuthError on 401/403
 */
export async function apiFetch(path: string, opts: RequestInit = {}) {
  /* ------------------------------------------------------------------ */
  /* 1 ░ prepare headers  ░ inject JWT if we have one                    */
  /* ------------------------------------------------------------------ */
  const headers = new Headers(opts.headers);

  if (!headers.has('Authorization') && chatClient?.['jwt']) {
    headers.set('Authorization', `Bearer ${chatClient['jwt']}`);
  }

  // Default to JSON unless the caller already set Content-Type
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  /* ------------------------------------------------------------------ */
  /* 2 ░ perform the fetch                                              */
  /* ------------------------------------------------------------------ */
  const res = await fetch(
    `/api${path.startsWith('/') ? '' : '/'}${path}`,
    { ...opts, headers },
  );

  /* ------------------------------------------------------------------ */
  /* 3 ░ auth guard + toast                                             */
  /* ------------------------------------------------------------------ */
  if (res.status === 401 || res.status === 403) {
    let body = '';
    try {
      body = await res.clone().text();
    } catch {
      /* ignore body read errors */
    }
    // eslint-disable-next-line no-console
    console.warn('apiFetch auth error', { path, status: res.status, body });

    const now = Date.now();
    if (now - lastToast > 60_000) {            // one toast per minute max
      lastToast = now;
      toast.error('Authentication required');
    }
    throw new AuthError(res.statusText);
  }

  return res;
}
