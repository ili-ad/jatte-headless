import { useEffect, useRef } from 'react';
import type { LocalMessage } from 'chat-shim';

/** Placeholder type for a message rendered in the list. */
type RenderedMessage = LocalMessage & { id: string; user?: { id?: string } };

/**
 * Minimal implementation of Stream's `useShouldForceScrollToBottom` hook.
 * It inspects the provided messages and returns a callback that indicates
 * whether a new message from the current user was appended to the list.
 */
export function useShouldForceScrollToBottom(
  messages: RenderedMessage[],
  currentUserId?: string,
): () => boolean {
  const lastFocusedOwnMessage = useRef('');
  const initialFocusRegistered = useRef(false);

  function recheckForNewOwnMessage(): boolean {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.user?.id === currentUserId &&
        lastFocusedOwnMessage.current !== lastMessage.id
      ) {
        lastFocusedOwnMessage.current = lastMessage.id;
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    if (messages && messages.length && !initialFocusRegistered.current) {
      initialFocusRegistered.current = true;
      recheckForNewOwnMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, messages?.length]);

  return recheckForNewOwnMessage;
}

export default useShouldForceScrollToBottom;
