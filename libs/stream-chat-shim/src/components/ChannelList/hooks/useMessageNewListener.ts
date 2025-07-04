import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';
import { clientChannel } from '../../../chatSDKShim';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useMessageNewListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext('useMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const channelInList =
            channels.filter((channel) => channel.cid === event.cid).length > 0;

          if (
            !channelInList &&
            allowNewMessagesFromUnfilteredChannels &&
            event.channel_type
          ) {
            const channel = clientChannel(
              client,
              event.channel_type,
              event.channel_id,
            ) as any;
            return uniqBy([channel, ...channels], 'cid');
          }

          if (!lockChannelOrder) return moveChannelUp({ channels, cid: event.cid || '' });

          return channels;
        });
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [
    allowNewMessagesFromUnfilteredChannels,
    client,
    customHandler,
    lockChannelOrder,
    setChannels,
  ]);
};
