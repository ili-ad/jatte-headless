import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'chat-shim';

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext('useIsChannelMuted');

  const [muted, setMuted] = useState(channel.muteStatus().muted);

  useEffect(() => {
    const handleEvent = () => setMuted(channel.muteStatus().muted);

    return () => {
      /* TODO backend-wire-up: client.off */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return muted;
};
