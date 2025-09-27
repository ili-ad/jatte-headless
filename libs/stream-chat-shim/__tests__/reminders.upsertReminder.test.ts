import { chatAPI } from '../src/api/chatAPI';
import { remindersUpsertReminder } from '../src/chatSDKShim';

describe('reminders.upsertReminder', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      (globalThis as any).fetch = originalFetch;
    } else {
      delete (globalThis as any).fetch;
    }
  });

  it('uses reminder manager when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const reminder = {
      cid: 'messaging:test',
      message_id: 42,
      remind_at: '2024-01-01T00:00:00Z',
    };

    const res = await chatAPI.reminders.upsertReminder({
      reminders: { upsertReminder: fn },
      reminder,
    });

    expect(fn).toHaveBeenCalledWith('42', '2024-01-01T00:00:00Z');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when reminder manager is missing', async () => {
    const response = {
      ok: true,
      json: jest.fn().mockResolvedValue('ok'),
    };
    const fetchMock = jest.fn().mockResolvedValue(response);
    (globalThis as any).fetch = fetchMock;

    const reminder = {
      cid: 'messaging:test',
      message_id: 42,
      remind_at: '2024-01-01T00:00:00Z',
    };

    const res = await chatAPI.reminders.upsertReminder({ reminder });

    expect(fetchMock).toHaveBeenCalledWith('/api/reminders/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminder),
    });
    expect(response.json).toHaveBeenCalled();
    expect(res).toBe('ok');
  });

  it('adds the reminder to the manager store when using HTTP fallback', async () => {
    const reminder = {
      cid: 'messaging:test',
      message_id: 55,
      remind_at: '2024-01-01T00:00:00Z',
    };
    const createdReminder = {
      id: 77,
      message_id: 55,
      remind_at: '2024-01-01T00:00:00Z',
    };
    const response = {
      ok: true,
      json: jest.fn().mockResolvedValue(createdReminder),
    };
    const fetchMock = jest.fn().mockResolvedValue(response);
    (globalThis as any).fetch = fetchMock;

    const dispatch = jest.fn();
    const manager = {
      store: {
        getLatestValue: jest.fn().mockReturnValue({ reminders: [] }),
        dispatch,
      },
      initTimers: jest.fn(),
    } as any;

    const res = await chatAPI.reminders.upsertReminder({ reminder, reminders: manager });

    expect(fetchMock).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      reminders: [{ reminder: createdReminder }],
    });
    expect(manager.initTimers).toHaveBeenCalled();
    expect(res).toEqual(createdReminder);
  });

  it('merges reminders into existing store and state entries', async () => {
    const reminder = {
      cid: 'messaging:test',
      message_id: 99,
      remind_at: '2024-01-02T00:00:00Z',
    };
    const serverReminder = {
      id: 1,
      message_id: 99,
      remind_at: '2024-01-02T00:00:00Z',
    };
    const response = {
      ok: true,
      json: jest.fn().mockResolvedValue(serverReminder),
    };
    (globalThis as any).fetch = jest.fn().mockResolvedValue(response);

    const timerHandle = Symbol('timer') as unknown as ReturnType<typeof setTimeout>;
    const existingEntry = {
      reminder: {
        id: 1,
        message_id: 99,
        remind_at: '2023-12-31T00:00:00Z',
      },
      timer: timerHandle,
    };

    const storeDispatch = jest.fn();
    const store = {
      getLatestValue: jest.fn().mockReturnValue({ reminders: [existingEntry] }),
      dispatch: storeDispatch,
    } as any;

    const mapContainer = new Map<string, any>([['99', existingEntry]]);
    const stateDispatch = jest.fn();
    const stateStore = {
      getLatestValue: jest.fn().mockReturnValue({ reminders: mapContainer }),
      dispatch: stateDispatch,
    } as any;

    const res = await chatAPI.reminders.upsertReminder({
      reminder,
      reminders: { store, state: stateStore } as any,
    });

    expect(res).toEqual(serverReminder);
    expect(mapContainer.get('99')?.reminder?.remind_at).toBe('2023-12-31T00:00:00Z');

    const storePatch = storeDispatch.mock.calls[0]?.[0];
    expect(storePatch?.reminders).toHaveLength(1);
    expect(storePatch?.reminders?.[0]?.reminder).toMatchObject(serverReminder);
    expect(storePatch?.reminders?.[0]?.timer).toBe(timerHandle);

    const statePatch = stateDispatch.mock.calls[0]?.[0];
    expect(statePatch?.reminders).toBeInstanceOf(Map);
    const entries = Array.from(
      (statePatch?.reminders as Map<string, any>).entries(),
    );
    expect(entries).toEqual([
      [
        '99',
        expect.objectContaining({
          reminder: expect.objectContaining(serverReminder),
        }),
      ],
    ]);
  });

  it('delegates through remindersUpsertReminder', async () => {
    const reminder = {
      cid: 'messaging:test',
      message_id: 42,
      remind_at: '2024-01-01T00:00:00Z',
    };
    const reminders = { upsertReminder: jest.fn() };
    const spy = jest
      .spyOn(chatAPI.reminders, 'upsertReminder')
      .mockResolvedValue('ok');

    const res = await remindersUpsertReminder(reminders as any, reminder);

    expect(spy).toHaveBeenCalledWith({ reminders, reminder });
    expect(res).toBe('ok');
  });
});
