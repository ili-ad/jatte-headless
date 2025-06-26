import type {
  Channel as StreamChannel,
  ChannelQueryOptions,
  LocalMessage,
  Message,
  MessageResponse,
  SendMessageOptions,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';
import React, { PropsWithChildren } from 'react';

import { useChatContext } from './ChatContext';

/**
 * Simplified placeholder for Stream's `Channel` component.
 * Only renders its children while exposing a few props matching the upstream
 * API surface. The real implementation from Stream Chat React is large and
 * integrates deeply with their backend SDK.
 */
export type ChannelProps = {
  /** The connected and active channel */
  channel?: StreamChannel;
  /** Optional configuration parameters used for the initial channel query */
  channelQueryOptions?: ChannelQueryOptions;
  /** Custom action handler to override the default `channel.sendMessage` request */
  doSendMessageRequest?: (
    channel: StreamChannel,
    message: Message,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
  /** React children to render inside the channel */
  children?: React.ReactNode;
};

export const Channel = (
  props: PropsWithChildren<ChannelProps>,
) => {
  const { children } = props;
  const { setActiveChannel } = useChatContext('Channel');
  // TODO backend-wire-up: initialization logic removed
  // When connected to the backend, this would watch the channel and handle
  // events. For now we simply expose the children inside a container.

  return <div data-testid="channel">{children}</div>;
};

export default Channel;
