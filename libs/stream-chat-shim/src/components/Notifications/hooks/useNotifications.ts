
import type { Notification, NotificationManagerState } from 'chat-shim';

import { chatAPI } from '../../../api/chatAPI';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const notificationsSelector = (
  state: NotificationManagerState,
): { notifications: Notification[] } => ({
  notifications: Array.isArray(state.notifications)
    ? (state.notifications as Notification[])
    : [],
});

export const useNotifications = (): Notification[] => {
  const { client } = useChatContext('useNotifications');
  const { store } = chatAPI.notifications.store({ client });
  const snapshot = useStateStore(store, notificationsSelector);
  return snapshot?.notifications ?? [];
};
