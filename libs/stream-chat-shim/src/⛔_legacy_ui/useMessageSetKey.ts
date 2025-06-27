import { useEffect, useRef, useState } from 'react';
import type { LocalMessage } from 'chat-shim';

export type UseMessageSetKeyParams = {
  messages?: LocalMessage[];
};

/**
 * Logic to update the key of the virtuoso component when the list jumps to a new location.
 */
export const useMessageSetKey = ({ messages }: UseMessageSetKeyParams) => {
  const [messageSetKey, setMessageSetKey] = useState(+new Date());
  const firstMessageId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const continuousSet = messages?.find(
      (message) => message.id === firstMessageId.current,
    );
    if (!continuousSet) {
      setMessageSetKey(+new Date());
    }
    firstMessageId.current = messages?.[0]?.id;
  }, [messages]);

  return {
    messageSetKey,
  } as const;
};
