import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { chatAPI } from '../../../api/chatAPI';

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

    const subscription = chatAPI.client.on(
      client,
      'notification.removed_from_channel',
      handleEvent,
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, customHandler, setChannels]);
};
