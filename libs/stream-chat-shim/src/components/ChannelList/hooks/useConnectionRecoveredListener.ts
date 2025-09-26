import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { chatAPI } from '../../../api/chatAPI';

export const useConnectionRecoveredListener = (forceUpdate?: () => void) => {
  const { client } = useChatContext('useConnectionRecoveredListener');

  useEffect(() => {
    const handleEvent = () => {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    const subscription = chatAPI.client.on(
      client,
      'connection.recovered',
      handleEvent,
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, forceUpdate]);
};
