import { useEffect, useState } from 'react';

import { useChatContext } from '../../../../context/ChatContext';
import { chatAPI } from '../../../../api/chatAPI';

import type { EventHandler, LocalMessage } from 'chat-shim';

export const useGiphyPreview = (separateGiphyPreview: boolean) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] = useState<LocalMessage>();

  const { client } = useChatContext('useGiphyPreview');

  useEffect(() => {
    if (!separateGiphyPreview) return;
    const handleEvent: EventHandler = (event) => {
      const { message, user } = event;

      if (message?.command === 'giphy' && user?.id === client.userID) {
        setGiphyPreviewMessage(undefined);
      }
    };

    const subscription = chatAPI.client.on(client, 'message.new', handleEvent);

    return () => {
      subscription.unsubscribe();
    };
  }, [client, separateGiphyPreview]);

  return {
    giphyPreviewMessage,
    setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
  };
};
