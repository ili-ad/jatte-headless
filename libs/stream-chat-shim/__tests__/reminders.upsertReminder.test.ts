import { remindersUpsertReminder } from '../src/chatSDKShim';

describe('remindersUpsertReminder', () => {
  it('calls reminders.upsertReminder when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await remindersUpsertReminder({ upsertReminder: fn } as any, '42', '2024-01-01T00:00:00Z');
    expect(fn).toHaveBeenCalledWith('42', '2024-01-01T00:00:00Z');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await remindersUpsertReminder(undefined, '42', '2024-01-01T00:00:00Z');
    expect(fetchMock).toHaveBeenCalledWith('/api/reminders/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: '42', remind_at: '2024-01-01T00:00:00Z' }),
    });
    expect(res).toBe('ok');
  });
});
