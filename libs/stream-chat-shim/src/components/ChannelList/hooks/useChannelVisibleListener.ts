import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../../../utils/getChannel';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useChannelVisibleListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
) => {
  const { client } = useChatContext('useChannelVisibleListener');

  useEffect(() => {
    const handleEvent = async (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (event.type && event.channel_type && event.channel_id) {
        const channel = await getChannel({
          client,
          id: event.channel_id,
          type: event.channel_type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, customHandler, setChannels]);
};
