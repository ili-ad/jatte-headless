import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { clientOff, clientOn } from '../../../client';

export const useConnectionRecoveredListener = (forceUpdate?: () => void) => {
  const { client } = useChatContext('useConnectionRecoveredListener');

  useEffect(() => {
    const handleEvent = () => {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    clientOn(client, 'connection.recovered', handleEvent);

    return () => {
      clientOff(client, 'connection.recovered', handleEvent);
    };
  }, [client, forceUpdate]);
};
