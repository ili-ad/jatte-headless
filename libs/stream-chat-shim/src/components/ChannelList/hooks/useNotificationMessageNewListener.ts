import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../../../utils/getChannel';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useNotificationMessageNewListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext('useNotificationMessageNewListener');

  useEffect(() => {
    const handleEvent = async (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel({
          client,
          id: event.channel.id,
          type: event.channel.type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [allowNewMessagesFromUnfilteredChannels, client, customHandler, setChannels]);
};
