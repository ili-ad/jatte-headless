import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { getChatCreds } from '../../src/lib/getChatCreds';
import { getAccessToken, setAccessToken } from '../../src/lib/authTokenStore';
import { setAuthToken } from '@iliad/stream-chat-shim';

vi.mock('../../src/lib/getChatCreds', () => ({ getChatCreds: vi.fn() }));
vi.mock('mitt', () => ({
  default: () => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@iliad/stream-chat-shim', () => ({
  AIStates: {
    Thinking: 'thinking',
    Generating: 'generating',
    Error: 'error',
    ExternalSources: 'external_sources',
    Idle: 'idle',
  },
  WS_BASE: 'ws://testserver',
  setAuthToken: vi.fn(),
}));

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('refresh uses Supabase credentials and synchronizes every active token store', async () => {
  (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  const client = new ChatClient();
  await client.connectUser({ id: 'u1' }, 't1');
  setAccessToken('t1');
  setAuthToken('t1');
  expect(client.tokenManager.getToken()).toBe('t1');

  vi.mocked(getChatCreds).mockResolvedValueOnce({ userID: 1, userToken: 't2' });
  await client.refreshToken();

  expect(getChatCreds).toHaveBeenCalledWith({ forceRefresh: true });
  expect(client.userToken).toBe('t2');
  expect(client.tokenManager.getToken()).toBe('t2');
  expect(getAccessToken()).toBe('t2');

  expect(setAuthToken).toHaveBeenLastCalledWith('t2');
});

test('failed Supabase refresh invents no token and preserves current credentials', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
  const client = new ChatClient();
  await client.connectUser({ id: 'u1' }, 't1');
  setAccessToken('t1');
  setAuthToken('t1');
  vi.mocked(getChatCreds).mockRejectedValueOnce(new Error('Supabase refresh failed'));

  await expect(client.refreshToken()).rejects.toThrow('Supabase refresh failed');
  expect(client.userToken).toBe('t1');
  expect(client.tokenManager.getToken()).toBe('t1');
  expect(getAccessToken()).toBe('t1');
});

test('disconnectUser resets tokenManager', () => {
  const client = new ChatClient('u1', 't1');
  client.disconnectUser();
  expect(client.tokenManager.token).toBeUndefined();
});
