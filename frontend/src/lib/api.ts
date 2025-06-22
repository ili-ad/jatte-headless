import { toast } from 'sonner';
import { AuthError } from './errors';

let lastToast = 0;

export async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path.startsWith('/') ? '' : '/'}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  if (res.status === 401 || res.status === 403) {
    const now = Date.now();
    if (now - lastToast > 60000) {
      lastToast = now;
      toast.error('Authentication required');
    }
    throw new AuthError(res.statusText);
  }
  return res;
}
