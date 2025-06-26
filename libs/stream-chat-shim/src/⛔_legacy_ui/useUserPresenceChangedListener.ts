import { useEffect } from 'react';
import type { Channel, Event } from 'stream-chat';

/**
 * Placeholder implementation for useUserPresenceChangedListener.
 * TODO: connect to Stream Chat client when available.
 *
 * @param setChannels - state setter for channels list
 * @param customHandler - optional custom event handler
 */
export const useUserPresenceChangedListener = (
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
