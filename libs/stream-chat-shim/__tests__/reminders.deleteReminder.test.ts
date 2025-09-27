import { remindersDeleteReminder } from '../src/chatSDKShim';
import { chatAPI } from '../src/api/chatAPI';

jest.mock('../src/api/chatAPI', () => ({
  chatAPI: {
    reminders: {
      deleteReminder: jest.fn().mockResolvedValue({ ok: true, reminderId: '42' }),
    },
  },
}));

describe('remindersDeleteReminder', () => {
  it('calls reminders.deleteReminder when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const reminders = { deleteReminder: fn } as any;
    const res = await remindersDeleteReminder(reminders, '42', {
      cid: 'messaging:test',
    });
    expect(fn).toHaveBeenCalledWith('42');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const res = await remindersDeleteReminder(undefined, '42', {
      cid: 'messaging:test',
    });
    expect(chatAPI.reminders.deleteReminder).toHaveBeenCalledWith({
      cid: 'messaging:test',
      reminderId: '42',
      client: { reminders: undefined },
    });
    expect(res).toEqual({ ok: true, reminderId: '42' });
  });
});
