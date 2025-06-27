import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

export const useChannelTruncatedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  forceUpdate?: () => void,
) => {
  useEffect(() => {
    // TODO: wire up real Stream Chat client events
  }, [setChannels, customHandler, forceUpdate]);
};
