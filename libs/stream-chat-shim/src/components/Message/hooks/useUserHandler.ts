import type { User } from 'chat-shim';

import type { ReactEventHandler } from '../types';
import type { LocalMessage } from 'chat-shim';

export type UserEventHandler = (event: React.BaseSyntheticEvent, user: User) => void;

export const useUserHandler = (
  message?: LocalMessage,
  eventHandlers?: {
    onUserClickHandler?: UserEventHandler;
    onUserHoverHandler?: UserEventHandler;
  },
): {
  onUserClick: ReactEventHandler;
  onUserHover: ReactEventHandler;
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
