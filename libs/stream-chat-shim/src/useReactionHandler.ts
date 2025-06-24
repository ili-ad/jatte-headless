import type React from 'react';
import { useCallback } from 'react';
import type { LocalMessage } from 'stream-chat';

/**
 * Minimal shim for Stream's `useReactionHandler` hook.
 * It exposes the same function signature but only logs a warning
 * indicating the handler is not yet implemented.
 */
export const reactionHandlerWarning =
  'Reaction handler was called, but the shim is not implemented.';

export const useReactionHandler = (_message?: LocalMessage) =>
  useCallback(async (_reactionType: string, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault?.();
    console.warn(reactionHandlerWarning);
  }, []);
