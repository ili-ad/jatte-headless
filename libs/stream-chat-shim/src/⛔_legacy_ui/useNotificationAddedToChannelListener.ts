import { useEffect } from 'react';
import type { Channel, Event } from 'chat-shim';

/**
 * Placeholder implementation of the `useNotificationAddedToChannelListener` hook.
 *
 * @param setChannels - State setter for the list of channels.
 * @param customHandler - Optional custom event handler.
 * @param allowNewMessagesFromUnfilteredChannels - Whether new messages from unfiltered channels should add the channel.
 */
export const useNotificationAddedToChannelListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  useEffect(() => {
    // TODO: integrate with Stream Chat client events
  }, [setChannels, customHandler, allowNewMessagesFromUnfilteredChannels]);
};

export default useNotificationAddedToChannelListener;
