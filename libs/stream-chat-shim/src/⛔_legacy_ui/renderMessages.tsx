import React from 'react';
import type { ReactNode } from 'react';
import type { UserResponse } from 'chat-shim';
import type { MessageProps } from './message-types';

// Placeholder type definitions for Stream UI internals
export type GroupStyle = any;
export type RenderedMessage = any;
export type ComponentContextValue = any;
export type ChannelUnreadUiState = any;
export type CustomClasses = Record<string, string>;

export type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy';

export type SharedMessageProps = Omit<MessageProps, MessagePropsToOmit>;

export interface RenderMessagesOptions {
  components: ComponentContextValue;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<RenderedMessage>;
  readData: Record<string, Array<UserResponse>>;
  sharedMessageProps: SharedMessageProps;
  channelUnreadUiState?: ChannelUnreadUiState;
  customClasses?: CustomClasses;
}

export type MessageRenderer = (
  options: RenderMessagesOptions,
) => Array<ReactNode>;

/**
 * Minimal placeholder implementation of Stream's renderMessages utility.
 * Each message is rendered as a simple list item.
 */
export const defaultRenderMessages: MessageRenderer = ({ messages }) =>
  messages.map((message: any) => (
    <li key={message.id || message.created_at}>Placeholder message</li>
  ));

export default defaultRenderMessages;
