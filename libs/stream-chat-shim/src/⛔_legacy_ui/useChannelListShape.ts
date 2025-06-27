import { useEffect } from 'react';
import type { Event } from 'chat-shim';

/**
 * Placeholder implementation for Stream's `useChannelListShape` hook.
 * Registers an effect with the provided event handler but does not
 * connect to a real Stream Chat client.
 */
export const useChannelListShape = (handler: (event: Event) => void) => {
  useEffect(() => {
    // TODO: integrate with Stream Chat client's event system
  }, [handler]);
};
