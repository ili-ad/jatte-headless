import type React from 'react';
import { useMemo } from 'react';

export type UseMessageListElementsProps = {
  enrichedMessages: any[];
  internalMessageProps: any;
  messageGroupStyles: Record<string, any>;
  renderMessages: (options: any) => React.ReactNode[];
  returnAllReadData: boolean;
  threadList: boolean;
  channelUnreadUiState?: any;
  read?: any;
};

/**
 * Placeholder implementation of Stream's `useMessageListElements` hook.
 * It simply calls the provided `renderMessages` function with the given
 * messages and returns its result.
 */
export const useMessageListElements = (
  props: UseMessageListElementsProps,
): React.ReactNode[] => {
  const { enrichedMessages, internalMessageProps, renderMessages, threadList } = props;

  const elements = useMemo(
    () =>
      renderMessages({
        messages: enrichedMessages,
        sharedMessageProps: { ...internalMessageProps, threadList },
      }),
    [enrichedMessages, renderMessages, internalMessageProps, threadList],
  );

  return elements;
};

export default useMessageListElements;
