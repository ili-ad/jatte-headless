import { remindersDeleteReminder } from '../src/chatSDKShim';

describe('remindersDeleteReminder', () => {
  it('calls reminders.deleteReminder when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const reminders = { deleteReminder: fn } as any;
    const res = await remindersDeleteReminder(reminders, '42');
    expect(fn).toHaveBeenCalledWith('42');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await remindersDeleteReminder(undefined, '42');
    expect(fetchMock).toHaveBeenCalledWith('/api/reminders/42/', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(res).toBe('ok');
  });
});
