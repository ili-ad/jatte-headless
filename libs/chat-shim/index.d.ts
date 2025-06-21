declare module 'stream-chat' {
  /** Local replacement for Stream’s client */
  export class LocalChatClient {
    connectUser(user: { id: string }, jwt: string): Promise<void>;
    channel(type: string, id: string): any;
    disconnectUser(): void;
    devToken(uid: string): string;
    setUserAgent(): void;
  }

  /** Compatibility singleton (mimics StreamChat.getInstance) */
  export class StreamChat extends LocalChatClient {
    static getInstance(apiKey?: string): StreamChat;
  }

  /** Convenience helper */
  export function getLocalClient(): LocalChatClient;

  /** Channel objects the UI works with (aliased to our LocalChannel). */
  export type Channel = import('../../libs/chat-shim').LocalChannel; 
  
  export type AIState = any;
  export type Event    = any;
  export type Reaction = any;
  export type UserResponse = any;

  export function isAudioAttachment(a: any): boolean;
  export function isFileAttachment(a: any): boolean;
  export function isImageAttachment(a: any): boolean;
  export function isScrapedContent(a: any): boolean;
  export function isVideoAttachment(a: any): boolean;
  export type isScrapedContent = any;
  export type isVideoAttachment = any;
  export function isVoiceRecordingAttachment(a: any): boolean;
  //export type  = any;
  export function localMessageToNewMessagePayload(local: LocalMessage): Message;
  export type ChannelSearchSource = any;
  export type MessageSearchSource = any;
  export type SearchController = any;
  export type UserSearchSource = any;
  export type StateStore = any;
  export function formatMessage(text: string): string;
  export type LinkPreviewsManager = any;
  export type isVoteAnswer = any;
  export type FixedSizeQueueCache = any;
  export type MessageComposer = any;
  export type VotingVisibility = any;
  export type BaseSearchSource = any;
  export type getTokenizedSuggestionDisplayName = any;
  export type getTriggerCharWithToken = any;
  export type insertItemWithTrigger = any;
  export type replaceWordWithEntity = any;
  export type StreamChat = any;
}



