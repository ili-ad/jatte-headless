import type React from 'react';
import type { LocalMessage } from 'stream-chat';

export type FormData = Record<string, string>;

export type ActionHandlerReturnType = (
  dataOrName?: string | FormData,
  value?: string,
  event?: React.BaseSyntheticEvent,
) => Promise<void> | void;

export const handleActionWarning =
  'Action handler was called, but it is missing one of its required arguments.' +
  ' Make sure the ChannelAction and ChannelState contexts are properly set and the hook is initialized with a valid message.';

/**
 * Placeholder implementation of `useActionHandler` from stream-chat-react.
 * Returns a handler function that currently throws to indicate missing behaviour.
 */
export function useActionHandler(_message?: LocalMessage): ActionHandlerReturnType {
  return async (_dataOrName?: string | FormData, _value?: string, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault?.();
    throw new Error('useActionHandler not implemented');
  };
}

export default useActionHandler;
