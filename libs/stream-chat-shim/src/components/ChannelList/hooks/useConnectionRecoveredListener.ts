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

    /* TODO backend-wire-up: client.on */

    return () => {
      /* TODO backend-wire-up: client.off */
    };
  }, [client, forceUpdate]);
};
