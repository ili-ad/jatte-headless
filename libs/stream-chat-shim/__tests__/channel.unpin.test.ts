import { StateStore } from 'chat-shim';

import { chatAPI } from '../src/api/chatAPI';

describe('chatAPI.channel.unpin', () => {
  it('invokes channel.unpin when available and normalizes the response', async () => {
    const at = '2024-01-01T00:00:00.000Z';
    const channel = {
      unpin: jest.fn().mockResolvedValue({ at }),
      state: {},
      stateStore: { dispatch: jest.fn() },
    };

    const result = await chatAPI.channel.unpin({ channel });

    expect(channel.unpin).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ pinned: false, at });
  });

  it('resets local membership state when unpinning', async () => {
    const membership = {
      pinned: true,
      pinned_at: '2024-01-01T12:00:00.000Z',
      pin_expires: '2024-01-02T00:00:00.000Z',
      pinned_by: { id: 'user-1' },
    } as Record<string, unknown>;

    const members: Record<string, Record<string, unknown>> = {
      'user-1': {
        pinned: true,
        pinned_at: '2024-01-01T12:00:00.000Z',
        pin_expires: '2024-01-02T00:00:00.000Z',
        pinned_by: { id: 'user-1' },
        extra: 'value',
      },
      'user-2': {
        pinned: true,
        pinned_at: '2024-01-01T12:00:00.000Z',
      },
    };

    const state = { membership, members };
    const stateStore = new StateStore(state);

    const channel = {
      state,
      stateStore,
      getClient: () => ({ user: { id: 'user-1' } }),
    };

    const result = await chatAPI.channel.unpin({ channel });

    expect(result.pinned).toBe(false);
    expect(typeof result.at).toBe('string');

    expect(state.membership?.pinned).toBe(false);
    expect(state.membership?.pinned_at).toBeNull();
    expect(state.membership?.pin_expires).toBeNull();
    expect(state.membership?.pinned_by).toBeNull();

    expect(state.members['user-1'].pinned).toBe(false);
    expect(state.members['user-1'].pinned_at).toBeNull();
    expect(state.members['user-1'].pin_expires).toBeNull();
    expect(state.members['user-1'].pinned_by).toBeNull();
    expect(state.members['user-1'].extra).toBe('value');

    expect(state.members['user-2'].pinned).toBe(true);
    expect(state.members['user-2'].pinned_at).toBe('2024-01-01T12:00:00.000Z');

    const storeSnapshot = stateStore.getLatestValue();
    expect(storeSnapshot.membership).toEqual(state.membership);
    expect(storeSnapshot.members).toEqual(state.members);
  });
});
