import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useNotificationRemovedFromChannelListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
) => {
  const { client } = useChatContext('useNotificationRemovedFromChannelListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) =>
          channels.filter((channel) => channel.cid !== event.channel?.cid),
        );
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, customHandler, setChannels]);
};
