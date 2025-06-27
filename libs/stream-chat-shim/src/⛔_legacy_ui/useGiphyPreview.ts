import { useEffect, useState } from 'react';
import type { EventHandler, LocalMessage } from 'chat-shim';

/**
 * Hook managing the giphy preview message state.
 *
 * This shim provides a minimal implementation and does not yet integrate
 * with the Stream Chat client. The API matches the real hook so it can be
 * wired up later without refactors.
 */
export const useGiphyPreview = (separateGiphyPreview: boolean) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] =
    useState<LocalMessage | undefined>();

  useEffect(() => {
    if (!separateGiphyPreview) return;
    // TODO: connect to Stream Chat client's `message.new` events
    // to clear the preview when a giphy message is sent.
    const handleEvent: EventHandler = () => {};
    return () => {
      void handleEvent;
    };
  }, [separateGiphyPreview]);

  return {
    giphyPreviewMessage,
    setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
  };
};
