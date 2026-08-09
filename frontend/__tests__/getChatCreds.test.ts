import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { getAccessToken, setAccessToken } from '../src/lib/authTokenStore';
import { getChatCreds } from '../src/lib/getChatCreds';
import { getSupabaseClient } from '../src/lib/supabaseClient';


vi.mock('../src/lib/supabaseClient', () => ({ getSupabaseClient: vi.fn() }));
vi.mock('@iliad/stream-chat-shim', () => ({ setAuthToken: vi.fn() }));

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
  setAccessToken(null);
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

function configureSupabase(accessToken: string) {
  const getSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: accessToken } },
    error: null,
  });
  const refreshSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: accessToken } },
    error: null,
  });
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: { getSession, refreshSession },
  } as any);
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ userID: 7, userToken: accessToken }),
  });
  return { getSession, refreshSession };
}

test('bootstrap validates the current Supabase access token through api/token', async () => {
  const auth = configureSupabase('current-supabase-token');
  const result = await getChatCreds();

  expect(auth.getSession).toHaveBeenCalledOnce();
  expect(auth.refreshSession).not.toHaveBeenCalled();
  expect(global.fetch).toHaveBeenCalledWith('/api/token/', {
    headers: { Authorization: 'Bearer current-supabase-token' },
  });
  expect(result).toEqual({ userID: 7, userToken: 'current-supabase-token' });
  expect(getAccessToken()).toBe('current-supabase-token');
});

test('forced refresh uses Supabase refreshSession and relays its access token', async () => {
  const auth = configureSupabase('refreshed-supabase-token');
  const result = await getChatCreds({ forceRefresh: true });

  expect(auth.refreshSession).toHaveBeenCalledOnce();
  expect(auth.getSession).not.toHaveBeenCalled();
  expect(result.userToken).toBe('refreshed-supabase-token');
  expect(getAccessToken()).toBe('refreshed-supabase-token');
});

test('Supabase refresh failure is propagated without calling Django', async () => {
  const refreshError = new Error('refresh rejected');
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: refreshError }),
    },
  } as any);
  setAccessToken('existing-token');

  await expect(getChatCreds({ forceRefresh: true })).rejects.toBe(refreshError);
  expect(global.fetch).not.toHaveBeenCalled();
  expect(getAccessToken()).toBe('existing-token');
});

test('bootstrap rejects a backend token substitution', async () => {
  configureSupabase('supabase-token');
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ userID: 7, userToken: 'different-token' }),
  });

  await expect(getChatCreds()).rejects.toThrow(
    'token endpoint did not relay the Supabase access token',
  );
  expect(getAccessToken()).toBeNull();
});
