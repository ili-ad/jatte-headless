import { ReminderManager } from '../index';

describe('createReminder', () => {
  test('posts to backend and updates store', async () => {
    const manager = new ReminderManager();
    const mockReminder = { id: 1, text: 'hello', remind_at: '2025-01-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' };
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ reminder: mockReminder }),
    }) as any;
    await manager.createReminder('hello', '2025-01-01T00:00:00Z');
    expect(fetch).toHaveBeenCalledWith('/api/reminders/', expect.any(Object));
    expect(manager.store.getLatestValue().reminders[0].reminder.id).toBe(1);
  });
});
