import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

/**
 * Placeholder implementation for useChannelUpdatedListener.
 * Hooks into channel update events when wired to a Stream Chat client.
 *
 * @param setChannels - State setter for the channel list.
 * @param customHandler - Optional callback for custom handling of the event.
 */
export const useChannelUpdatedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
) => {
  useEffect(() => {
    // TODO: wire up real Stream Chat client events
  }, [setChannels, customHandler]);
};
