import { chatAPI } from '../src/api/chatAPI';
import { StateStore } from 'chat-shim';

describe('chatAPI.reminders.deleteReminder', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error restore to undefined when not provided
      delete global.fetch;
    }
    jest.restoreAllMocks();
  });

  it('removes reminder from local stores and cancels timers on fallback', async () => {
    const timerHandle = {} as unknown as ReturnType<typeof setTimeout>;
    const remindersStore = new StateStore({
      reminders: [
        {
          reminder: { id: 42, message_id: 123 },
          timer: timerHandle,
        },
      ],
    });
    const remindersState = new StateStore({
      reminders: new Map([["123", { id: 42 }]]),
    });

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
    // @ts-expect-error fetch is not typed on the Node global in tests
    global.fetch = fetchMock;

    const clearTimeoutSpy = jest
      .spyOn(global, 'clearTimeout')
      .mockImplementation(() => undefined as any);

    const result = await chatAPI.reminders.deleteReminder({
      cid: 'messaging:test',
      reminderId: '42',
      client: { reminders: { store: remindersStore, state: remindersState } },
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/reminders/42/', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(result).toEqual({ ok: true, reminderId: '42' });
    expect(remindersStore.getLatestValue().reminders).toHaveLength(0);
    expect(remindersState.getLatestValue().reminders.size).toBe(0);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerHandle);
  });
});
