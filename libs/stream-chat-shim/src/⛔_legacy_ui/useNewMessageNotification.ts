// libs/stream-chat-shim/src/useNewMessageNotification.ts
import { useRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

/** Placeholder type mirroring Stream's `RenderedMessage`. */
export type RenderedMessage = LocalMessage | Record<string, any>;

/**
 * Placeholder implementation of Stream's `useNewMessageNotification` hook.
 *
 * It exposes the same API shape but performs no real notification logic.
 */
export function useNewMessageNotification(
  _messages: RenderedMessage[],
  _currentUserId: string | undefined,
  _hasMoreNewer?: boolean,
) {
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);
  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const atBottom = useRef(false);

  // TODO: connect to Stream Chat events
  return {
    atBottom,
    isMessageListScrolledToBottom,
    newMessagesNotification,
    setIsMessageListScrolledToBottom,
    setNewMessagesNotification,
  };
}

export default useNewMessageNotification;
