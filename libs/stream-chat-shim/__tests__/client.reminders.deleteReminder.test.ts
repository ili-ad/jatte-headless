import { clientRemindersDeleteReminder } from '../src/chatSDKShim';

describe('clientRemindersDeleteReminder', () => {
  it('calls client.reminders.deleteReminder when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const client = { reminders: { deleteReminder: fn } } as any;
    const res = await clientRemindersDeleteReminder(client, '42');
    expect(fn).toHaveBeenCalledWith('42');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await clientRemindersDeleteReminder({} as any, '42');
    expect(fetchMock).toHaveBeenCalledWith('/api/reminders/42/', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(res).toBe('ok');
  });
});
