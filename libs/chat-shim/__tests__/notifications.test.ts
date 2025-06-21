import { Notification, NotificationManagerState } from '../index';

describe('notifications types', () => {
  test('toast and banner', () => {
    const toast: Notification = { type: 'toast', text: 'hello' };
    const banner: Notification = { type: 'banner', text: 'hi' };
    const state: NotificationManagerState = { notifications: [toast, banner] };
    expect(state.notifications[0].type).toBe('toast');
    expect(state.notifications[1].type).toBe('banner');
  });
});
