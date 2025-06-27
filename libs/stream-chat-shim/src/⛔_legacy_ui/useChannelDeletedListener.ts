import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

export const useChannelDeletedListener = (
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
