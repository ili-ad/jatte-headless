import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

export const useConnectionRecoveredListener = (forceUpdate?: () => void) => {
  const { client } = useChatContext('useConnectionRecoveredListener');

  useEffect(() => {
    const handleEvent = () => {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, forceUpdate]);
};
