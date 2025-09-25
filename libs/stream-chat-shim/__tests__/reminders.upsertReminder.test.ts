import { chatAPI } from '../src/api/chatAPI';
import { remindersUpsertReminder } from '../src/chatSDKShim';

jest.mock('../src/api/chatAPI', () => ({
  chatAPI: {
    createReminder: jest.fn().mockResolvedValue('ok'),
  },
}));

describe('remindersUpsertReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls reminders.upsertReminder when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await remindersUpsertReminder(
      { upsertReminder: fn } as any,
      { cid: 'messaging:test', message_id: 42, remind_at: '2024-01-01T00:00:00Z' },
    );
    expect(fn).toHaveBeenCalledWith('42', '2024-01-01T00:00:00Z');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    (chatAPI.createReminder as jest.Mock).mockResolvedValueOnce('ok');
    const res = await remindersUpsertReminder(undefined, {
      cid: 'messaging:test',
      message_id: 42,
      remind_at: '2024-01-01T00:00:00Z',
    });
    expect(chatAPI.createReminder).toHaveBeenCalledWith({
      cid: 'messaging:test',
      message_id: 42,
      remind_at: '2024-01-01T00:00:00Z',
    });
    expect(res).toBe('ok');
  });
});
