import { useEffect, useState } from 'react';
import type { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';

/**
 * Placeholder hook for Stream's `useChannelMembershipState`.
 *
 * Keeps track of channel membership data. The real implementation
 * should listen to membership events on the channel and update state
 * accordingly.
 */
export const useChannelMembershipState = (
  channel?: Channel<EventTypes>,
) => {
  const [members, setMembers] = useState<Record<string, ChannelMemberResponse>>(
    {},
  );

  useEffect(() => {
    // TODO: subscribe to channel membership events and update state
    setMembers({});
  }, [channel]);

  return { members };
};
