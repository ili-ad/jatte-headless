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
