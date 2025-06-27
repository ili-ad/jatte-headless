import { useEffect, useState } from 'react';
import type { Notification } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `useNotifications` hook.
 * Currently returns an empty list and performs no real subscriptions.
 */
export const useNotifications = (): Notification[] => {
  const [notifications] = useState<Notification[]>([]);

  useEffect(() => {
    // TODO: integrate with Stream Chat client's notifications store
  }, []);

  return notifications;
};

export default useNotifications;
