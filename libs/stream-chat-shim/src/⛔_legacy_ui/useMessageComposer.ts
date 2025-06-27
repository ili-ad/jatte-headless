import { useEffect, useMemo } from 'react';
import { MessageComposer } from 'chat-shim';

/**
 * Lightweight placeholder for Stream's `useMessageComposer` hook.
 *
 * Returns a new {@link MessageComposer} instance. In the real
 * implementation this hook would integrate with chat contexts
 * to return the composer for the current channel or thread.
 */
export const useMessageComposer = () => {
  const composer = useMemo(() => new MessageComposer(), []);

  useEffect(() => {
    // TODO: register subscriptions with the Stream Chat client
  }, [composer]);

  return composer;
};

export default useMessageComposer;
