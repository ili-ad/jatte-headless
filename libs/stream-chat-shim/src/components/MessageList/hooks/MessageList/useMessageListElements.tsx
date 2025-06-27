import type React from 'react';
import { useMemo } from 'react';

// import { useLastReadData } from '../useLastReadData'; // TODO backend-wire-up
const useLastReadData = () => ({} as any); // temporary shim
// import { getLastReceived } from '../../utils'; // TODO backend-wire-up
const getLastReceived = () => null as any;

// import { useChatContext } from '../../../../context/ChatContext'; // TODO backend-wire-up
const useChatContext = () => ({ client: {} as any, customClasses: {} as any });
// import { useComponentContext } from '../../../../context/ComponentContext'; // TODO backend-wire-up
const useComponentContext = () => ({} as any);

/* TODO backend-wire-up: StreamChannelState import excised */
import type { ChannelState as StreamChannelState } from 'chat-shim';

// import type { GroupStyle, RenderedMessage } from '../../utils'; // TODO backend-wire-up
type GroupStyle = any;
type RenderedMessage = any;
import type { ChannelUnreadUiState } from '../../../../types/types';
// import type { MessageRenderer, SharedMessageProps } from '../../renderMessages'; // TODO backend-wire-up
type MessageRenderer = any;
type SharedMessageProps = any;

type UseMessageListElementsProps = {
  enrichedMessages: RenderedMessage[];
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  threadList: boolean;
  channelUnreadUiState?: ChannelUnreadUiState;
  read?: StreamChannelState['read'];
};

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    channelUnreadUiState,
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    read,
    renderMessages,
    returnAllReadData,
    threadList,
  } = props;

  const { client, customClasses } = useChatContext('useMessageListElements');
  const components = useComponentContext('useMessageListElements');

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    messages: enrichedMessages,
    read,
    returnAllReadData,
    userID: client.userID,
  });

  const lastReceivedMessageId = useMemo(
    () => getLastReceived(enrichedMessages),
    [enrichedMessages],
  );

  const elements: React.ReactNode[] = useMemo(
    () =>
      renderMessages({
        channelUnreadUiState,
        components,
        customClasses,
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        readData,
        sharedMessageProps: { ...internalMessageProps, threadList },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enrichedMessages,
      internalMessageProps,
      lastReceivedMessageId,
      messageGroupStyles,
      channelUnreadUiState,
      readData,
      renderMessages,
      threadList,
    ],
  );

  return elements;
};
