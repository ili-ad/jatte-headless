import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'chat-shim';

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext('useIsChannelMuted');

  const [muted, setMuted] = useState(
    /* TODO backend-wire-up: channel.muteStatus */ false,
  );

  useEffect(() => {
    const handleEvent = () =>
      setMuted(/* TODO backend-wire-up: channel.muteStatus */ false);

    /* TODO backend-wire-up: client.on */
    return () => {
      /* TODO backend-wire-up: client.off */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return muted;
};
