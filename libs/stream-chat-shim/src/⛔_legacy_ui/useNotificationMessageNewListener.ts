import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `useNotificationMessageNewListener` hook.
 * It currently does not subscribe to any events.
 */
export const useNotificationMessageNewListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  useEffect(() => {
    // TODO: wire up real Stream Chat client events
  }, [setChannels, customHandler, allowNewMessagesFromUnfilteredChannels]);
};
