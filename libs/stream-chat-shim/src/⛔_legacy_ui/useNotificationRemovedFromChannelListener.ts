import { useEffect } from 'react';
import type { Channel, Event } from 'stream-chat';

export const useNotificationRemovedFromChannelListener = (
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
