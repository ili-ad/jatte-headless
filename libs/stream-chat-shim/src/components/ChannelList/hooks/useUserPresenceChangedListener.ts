import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { chatAPI } from '../../../api/chatAPI';

import type { Channel, Event } from 'chat-shim';

export const useUserPresenceChangedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
) => {
  const { client } = useChatContext('useUserPresenceChangedListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id]) {
            return channel;
          }

          const newChannel = channel; // dumb workaround for linter
          newChannel.state.members[event.user.id].user = event.user;

          return newChannel;
        });

        return [...newChannels];
      });
    };

    const subscription = chatAPI.client.on(
      client,
      'user.presence.changed',
      handleEvent,
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, setChannels]);
};
