import { renderHook, act } from '@testing-library/react';
import { useUnreadMessagesNotificationVirtualized } from '../src/useUnreadMessagesNotificationVirtualized';
import type { LocalMessage } from 'stream-chat';

describe('useUnreadMessagesNotificationVirtualized', () => {
  const makeMessage = (created_at: string | number | Date): LocalMessage => (
    { created_at } as LocalMessage
  );

  test('toggles visibility based on rendered messages', () => {
    const lastRead = new Date('2021-01-01T12:00:00Z');
    const { result } = renderHook(() =>
      useUnreadMessagesNotificationVirtualized({
        showAlways: false,
        unreadCount: 1,
        lastRead,
      })
    );

    act(() => {
      result.current.toggleShowUnreadMessagesNotification([
        makeMessage('2021-01-01T13:00:00Z'),
        makeMessage('2021-01-01T14:00:00Z'),
      ]);
    });
    expect(result.current.show).toBe(true);

    act(() => {
      result.current.toggleShowUnreadMessagesNotification([
        makeMessage('2020-12-31T23:00:00Z'),
        makeMessage('2020-12-31T23:59:59Z'),
      ]);
    });
    expect(result.current.show).toBe(false);
  });

  test('hides when unread count resets', () => {
    const lastRead = new Date('2021-01-01T12:00:00Z');
    const { result, rerender } = renderHook(
      ({ count }) =>
        useUnreadMessagesNotificationVirtualized({
          showAlways: false,
          unreadCount: count,
          lastRead,
        }),
      { initialProps: { count: 1 } }
    );

    act(() => {
      result.current.toggleShowUnreadMessagesNotification([
        makeMessage('2021-01-01T13:00:00Z'),
        makeMessage('2021-01-01T14:00:00Z'),
      ]);
    });
    expect(result.current.show).toBe(true);

    rerender({ count: 0 });
    expect(result.current.show).toBe(false);
  });
});
