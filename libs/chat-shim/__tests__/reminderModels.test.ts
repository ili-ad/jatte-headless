import { Reminder, ReminderState, ReminderManagerState, ReminderManager } from '../index';

describe('reminder models', () => {
  test('basic shapes', () => {
    const rem: Reminder = { id: 'r1', text: 'hi', remind_at: '' };
    const rs: ReminderState = { reminder: rem };
    const manager = new ReminderManager();
    manager.store.dispatch({ reminders: [rs] });
    const state: ReminderManagerState = manager.store.getState();
    expect(state.reminders[0].reminder.id).toBe('r1');
  });
});
