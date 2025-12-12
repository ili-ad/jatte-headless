const BASE_DELAY_MS = 250;
const MAX_DELAY_MS = 5000;
export const MAX_BOOTSTRAP_ATTEMPTS = 6;

export function shouldRetry(status: number | null, error?: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return false;
  }

  if (status === 401 || status === 403 || status === 404) {
    return false;
  }

  if (status === 408 || status === 429) {
    return true;
  }

  if (status !== null && status >= 500) {
    return true;
  }

  // Network / unknown errors: retry unless explicitly aborted.
  return status === null;
}

export function nextDelayMs(attempt: number): number {
  const base = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.random() * 0.25 * base;
  return base + jitter;
}
