import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'chat-shim';

export const useChannelTruncatedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext('useChannelTruncatedListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setChannels((channels) => [...channels]);

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
      if (forceUpdate) {
        forceUpdate();
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, customHandler, forceUpdate, setChannels]);
};
