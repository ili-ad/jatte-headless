import type { User } from 'chat-shim';
import type { LocalMessage } from 'chat-shim';

export type UserEventHandler = (
  event: React.BaseSyntheticEvent,
  user: User,
) => void;

/**
 * Replacement for Stream's `useUserHandler` hook.
 * Returns click and hover handlers for a message's user.
 */
export const useUserHandler = (
  message?: LocalMessage,
  eventHandlers?: {
    onUserClickHandler?: UserEventHandler;
    onUserHoverHandler?: UserEventHandler;
  },
): {
  onUserClick: (event: React.BaseSyntheticEvent) => void;
  onUserHover: (event: React.BaseSyntheticEvent) => void;
} => ({
  onUserClick: (event) => {
    if (typeof eventHandlers?.onUserClickHandler !== 'function' || !message?.user) {
      return;
    }
    eventHandlers.onUserClickHandler(event, message.user);
  },
  onUserHover: (event) => {
    if (typeof eventHandlers?.onUserHoverHandler !== 'function' || !message?.user) {
      return;
    }
    eventHandlers.onUserHoverHandler(event, message.user);
  },
});
