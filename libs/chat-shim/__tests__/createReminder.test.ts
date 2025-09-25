import { ReminderManager } from '../index';

describe('createReminder', () => {
  test('posts to backend and updates store', async () => {
    const manager = new ReminderManager();
    const mockReminder = {
      id: 1,
      note: 'hello',
      remind_at: '2025-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      created_by: 7,
      message_id: 9,
    };
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => mockReminder,
    }) as any;
    await manager.createReminder({
      cid: 'messaging:test',
      note: 'hello',
      remind_at: '2025-01-01T00:00:00Z',
      message_id: 9,
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms/messaging%3Atest/reminders/',
      expect.objectContaining({
        body: JSON.stringify({ note: 'hello', remind_at: '2025-01-01T00:00:00Z', message_id: 9 }),
      }),
    );
    expect(manager.store.getLatestValue().reminders[0].reminder.id).toBe(1);
  });
});
