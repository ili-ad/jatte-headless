import { toast } from 'sonner';
import { AuthError } from './errors';

let lastToast = 0;

export async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path.startsWith('/') ? '' : '/'}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  if (res.status === 401 || res.status === 403) {
    let body = '';
    try {
      body = await res.clone().text();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line no-console
    console.warn('apiFetch auth error', { path, status: res.status, body });
    const now = Date.now();
    if (now - lastToast > 60000) {
      lastToast = now;
      toast.error('Authentication required');
    }
    throw new AuthError(res.statusText);
  }
  return res;
}
