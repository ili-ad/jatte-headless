import { StateStore } from 'chat-shim';

import { chatAPI } from '../src/api/chatAPI';

describe('chatAPI.reminders.unregisterSubscriptions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates to the client and clears reminder stores', async () => {
    const timerHandle = {} as unknown as ReturnType<typeof setTimeout>;

    const remindersStore = new StateStore({
      reminders: [
        {
          reminder: { id: '42', message_id: '99' },
          timer: timerHandle,
        },
      ],
    });

    const remindersState = new StateStore({
      reminders: new Map([[
        '99',
        { reminder: { id: '42', message_id: '99' } },
      ]]),
    });

    const unregisterSubscriptions = jest.fn();
    const clearTimers = jest.fn();

    const client = {
      reminders: {
        unregisterSubscriptions,
        clearTimers,
        store: remindersStore,
        state: remindersState,
      },
    } as const;

    const clearTimeoutSpy = jest
      .spyOn(global, 'clearTimeout')
      .mockImplementation(() => undefined as any);

    await chatAPI.reminders.unregisterSubscriptions({ client });

    expect(unregisterSubscriptions).toHaveBeenCalled();
    expect(clearTimers).toHaveBeenCalled();
    expect(remindersStore.getLatestValue().reminders).toHaveLength(0);

    const stateSnapshot = remindersState.getLatestValue().reminders;
    if (stateSnapshot instanceof Map) {
      expect(stateSnapshot.size).toBe(0);
    } else if (Array.isArray(stateSnapshot)) {
      expect(stateSnapshot.length).toBe(0);
    } else if (stateSnapshot && typeof stateSnapshot === 'object') {
      expect(Object.keys(stateSnapshot).length).toBe(0);
    } else {
      expect(stateSnapshot).toBeUndefined();
    }

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerHandle);
  });

  it('resolves when the reminders helper is missing', async () => {
    await expect(
      chatAPI.reminders.unregisterSubscriptions({ client: {} as any }),
    ).resolves.toBeUndefined();
  });
});
