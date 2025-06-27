import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useChannelUpdatedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext('useChannelUpdatedListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setChannels((channels) => {
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === event.channel?.cid,
        );

        if (channelIndex > -1 && event.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = {
            ...event.channel,
            hidden: event.channel?.hidden ?? newChannels[channelIndex].data?.hidden,
            own_capabilities:
              event.channel?.own_capabilities ??
              newChannels[channelIndex].data?.own_capabilities,
          };

          return [...newChannels];
        }

        return channels;
      });
      if (forceUpdate) {
        forceUpdate();
      }
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
    };

    /* TODO backend-wire-up: client.on */

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, customHandler, forceUpdate, setChannels]);
};
