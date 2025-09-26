import { useEffect, useState } from 'react';

import { useChatContext } from '../../../../context/ChatContext';
import { clientOff, clientOn } from '../../../../client';

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

    clientOn(client, 'message.new', handleEvent);

    return () => {
      clientOff(client, 'message.new', handleEvent);
    };
  }, [client, separateGiphyPreview]);

  return {
    giphyPreviewMessage,
    setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
  };
};
