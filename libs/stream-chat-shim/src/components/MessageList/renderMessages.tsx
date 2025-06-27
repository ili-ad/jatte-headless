import React, { Fragment } from 'react';
// import { getIsFirstUnreadMessage, isDateSeparatorMessage, isIntroMessage } from './utils'; // TODO backend-wire-up
const getIsFirstUnreadMessage = () => false; // temporary shim
const isDateSeparatorMessage = () => false; // temporary shim
const isIntroMessage = () => false; // temporary shim
import { Message } from '../Message';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';
// import { UnreadMessagesSeparator as DefaultUnreadMessagesSeparator } from './UnreadMessagesSeparator'; // TODO backend-wire-up
const DefaultUnreadMessagesSeparator = (() => null) as React.ComponentType<any>; // temporary shim
import type { ReactNode } from 'react';
import type { UserResponse } from 'chat-shim';
// import type { GroupStyle, RenderedMessage } from './utils'; // TODO backend-wire-up
type GroupStyle = any; // temporary shim
// eslint-disable-next-line @typescript-eslint/no-redeclare -- TODO backend-wire-up
type RenderedMessage = any; // temporary shim
import type { MessageProps } from '../Message';
// import type { ComponentContextValue, CustomClasses } from '../../context'; // TODO backend-wire-up
type ComponentContextValue = any;
type CustomClasses = Record<string, string>;
// import type { ChannelUnreadUiState } from '../../types'; // TODO backend-wire-up
type ChannelUnreadUiState = any;

export interface RenderMessagesOptions {
  components: ComponentContextValue;
  lastReceivedMessageId: string | null;
  messageGroupStyles: Record<string, GroupStyle>;
  messages: Array<RenderedMessage>;
  /**
   * Object mapping message IDs of own messages to the users who read those messages.
   */
  readData: Record<string, Array<UserResponse>>;
  /**
   * Props forwarded to the Message component.
   */
  sharedMessageProps: SharedMessageProps;
  /**
   * Current user's channel read state used to render components reflecting unread state.
   * It does not reflect the back-end state if a channel is marked read on mount.
   * This is in order to keep the unread UI when an unread channel is open.
   */
  channelUnreadUiState?: ChannelUnreadUiState;
  customClasses?: CustomClasses;
}

export type SharedMessageProps = Omit<MessageProps, MessagePropsToOmit>;

export type MessageRenderer = (options: RenderMessagesOptions) => Array<ReactNode>;

type MessagePropsToOmit =
  | 'channel'
  | 'groupStyles'
  | 'initialMessage'
  | 'lastReceivedId'
  | 'message'
  | 'readBy';

export function defaultRenderMessages({
  channelUnreadUiState,
  components,
  customClasses,
  lastReceivedMessageId: lastReceivedId,
  messageGroupStyles,
  messages,
  readData,
  sharedMessageProps: messageProps,
}: RenderMessagesOptions) {
  const {
    DateSeparator = DefaultDateSeparator,
    HeaderComponent,
    MessageSystem = DefaultMessageSystem,
    UnreadMessagesSeparator = DefaultUnreadMessagesSeparator,
  } = components as any;

  const renderedMessages = [] as Array<ReactNode>;
  let firstMessage;
  let previousMessage = undefined;
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (isDateSeparatorMessage(message)) {
      renderedMessages.push(
        <li key={`${(message as any).date.toISOString()}-i`}>
          <DateSeparator
            date={(message as any).date}
            formatDate={messageProps.formatDate}
            unread={(message as any).unread}
          />
        </li>,
      );
    } else if (isIntroMessage(message)) {
      if (HeaderComponent) {
        renderedMessages.push(
          <li key='intro'>
            <HeaderComponent />
          </li>,
        );
      }
    } else if ((message as any).type === 'system') {
      renderedMessages.push(
        <li
          data-message-id={(message as any).id}
          key={(message as any).id || (message as any).created_at.toISOString()}
        >
          <MessageSystem message={message as any} />
        </li>,
      );
    } else {
      if (!firstMessage) {
        firstMessage = message;
      }
      const groupStyles: GroupStyle = messageGroupStyles[(message as any).id] || '';
      const messageClass =
        customClasses?.message || `str-chat__li str-chat__li--${groupStyles}`;

      const isFirstUnreadMessage = getIsFirstUnreadMessage({
        firstUnreadMessageId: (channelUnreadUiState as any)?.first_unread_message_id,
        isFirstMessage: !!firstMessage?.id && (firstMessage as any).id === (message as any).id,
        lastReadDate: (channelUnreadUiState as any)?.last_read,
        lastReadMessageId: (channelUnreadUiState as any)?.last_read_message_id,
        message: message as any,
        previousMessage,
        unreadMessageCount: (channelUnreadUiState as any)?.unread_messages,
      });

      renderedMessages.push(
        <Fragment key={(message as any).id || (message as any).created_at.toISOString()}>
          {isFirstUnreadMessage && UnreadMessagesSeparator && (
            <li className='str-chat__li str-chat__unread-messages-separator-wrapper'>
              <UnreadMessagesSeparator
                unreadCount={(channelUnreadUiState as any)?.unread_messages}
              />
            </li>
          )}
          <li
            className={messageClass}
            data-message-id={(message as any).id}
            data-testid={messageClass}
          >
            <Message
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              lastReceivedId={lastReceivedId}
              message={message as any}
              readBy={readData[(message as any).id] || []}
              {...messageProps}
            />
          </li>
        </Fragment>,
      );
      previousMessage = message;
    }
  }
  return renderedMessages;
}
