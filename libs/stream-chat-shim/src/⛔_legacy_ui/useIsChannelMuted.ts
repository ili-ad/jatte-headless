import { useEffect, useState } from 'react';
import type { Channel } from 'chat-shim';

/**
 * Minimal replacement for Stream Chat React's `useIsChannelMuted` hook.
 * Tracks whether the given channel is muted and updates on
 * `notification.channel_mutes_updated` events.
 */
export const useIsChannelMuted = (channel: Channel) => {
  // attempt to access the client from the channel object
  const client: any = (channel as any).client;

  const [muted, setMuted] = useState(() => channel.muteStatus());

  useEffect(() => {
    if (!client?.on) return;
    const handleEvent = () => setMuted(channel.muteStatus());
    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off?.('notification.channel_mutes_updated', handleEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return muted;
};
