import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

import { useChatContext } from '../../../context/ChatContext';
import { clientOff, clientOn } from '../../../client';

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

    clientOn(client, 'channel.deleted', handleEvent);

    return () => {
      clientOff(client, 'channel.deleted', handleEvent);
    };
  }, [client, customHandler, setChannels]);
};
