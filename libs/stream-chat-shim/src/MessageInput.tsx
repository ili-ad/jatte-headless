import React, { PropsWithChildren } from 'react';
import type { Channel, Message, SendFileAPIResponse } from 'stream-chat';

// Placeholder types mirroring those from stream-chat-react
export interface DefaultStreamChatGenerics {}
export type CustomTrigger = any;
export type UnknownType = any;
export type MessageToSend<StreamChatGenerics = DefaultStreamChatGenerics> = any;
export type SearchQueryParams<T> = any;
export type FileUpload = { file: File } & Record<string, any>;
export type ImageUpload = { file: File } & Record<string, any>;
export type URLEnrichmentConfig = any;
export interface ComponentContextValue {
  emojiSearchIndex?: any;
}
export type StreamMessage<StreamChatGenerics = DefaultStreamChatGenerics> = Message;
export type SendMessageOptions = any;

export interface EmojiSearchIndexResult {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  emoticons?: Array<string>;
  native?: string;
}

export interface EmojiSearchIndex<T extends UnknownType = UnknownType> {
  search: (
    query: string,
  ) => PromiseLike<Array<EmojiSearchIndexResult & T>> | Array<EmojiSearchIndexResult & T> | null;
}

export type MessageInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  clearEditingState?: () => void;
  disabled?: boolean;
  disableMentions?: boolean;
  doFileUploadRequest?: (
    file: FileUpload['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  doImageUploadRequest?: (
    file: ImageUpload['file'],
    channel: Channel<StreamChatGenerics>,
  ) => Promise<SendFileAPIResponse>;
  emojiSearchIndex?: ComponentContextValue['emojiSearchIndex'];
  errorHandler?: (
    error: Error,
    type: string,
    file: (FileUpload | ImageUpload)['file'] & { id?: string },
  ) => void;
  focus?: boolean;
  getDefaultValue?: () => string | string[];
  grow?: boolean;
  hideSendButton?: boolean;
  Input?: React.ComponentType<MessageInputProps<StreamChatGenerics, V>>;
  maxRows?: number;
  mentionAllAppUsers?: boolean;
  mentionQueryParams?: SearchQueryParams<StreamChatGenerics>['userFilters'];
  message?: StreamMessage<StreamChatGenerics>;
  noFiles?: boolean;
  overrideSubmitHandler?: (
    message: MessageToSend<StreamChatGenerics>,
    channelCid: string,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => Promise<void> | void;
  parent?: StreamMessage<StreamChatGenerics>;
  publishTypingEvent?: boolean;
  shouldSubmit?: (event: KeyboardEvent) => boolean;
  urlEnrichmentConfig?: URLEnrichmentConfig;
  useMentionsTransliteration?: boolean;
};

/**
 * Placeholder implementation of the MessageInput component.
 */
export const MessageInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  _props: PropsWithChildren<MessageInputProps<StreamChatGenerics, V>>,
) => {
  return <div data-testid="message-input">MessageInput</div>;
};

export default MessageInput;
