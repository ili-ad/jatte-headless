import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

import { useChatContext } from '../../../context/ChatContext';

export const useChannelDeletedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
) => {
  const { client } = useChatContext('useChannelDeletedListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const channelIndex = channels.findIndex((channel) => channel.cid === event.cid);

          if (channelIndex < 0) return [...channels];

          // Remove the deleted channel from the list
          channels.splice(channelIndex, 1);

          return [...channels];
        });
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, customHandler, setChannels]);
};
