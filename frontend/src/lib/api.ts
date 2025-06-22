export const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`/api${path.startsWith('/') ? '' : '/'}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
