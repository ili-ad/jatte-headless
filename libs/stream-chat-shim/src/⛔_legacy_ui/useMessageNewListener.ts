import { useEffect } from 'react';
import type { Channel, Event } from 'stream-chat';

/**
 * Placeholder for Stream\'s useMessageNewListener hook.
 * Sets up a listener for new message events.
 */
export const useMessageNewListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  useEffect(() => {
    // TODO: wire up real Stream Chat client events
  }, [
    setChannels,
    customHandler,
    lockChannelOrder,
    allowNewMessagesFromUnfilteredChannels,
  ]);
};
