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
  export type isAudioAttachment = any;
  export type isFileAttachment = any;
  export type isImageAttachment = any;
  export type isScrapedContent = any;
  export type isVideoAttachment = any;
  export type isVoiceRecordingAttachment = any;
  //export type  = any;
  export type localMessageToNewMessagePayload = any;
  export type ChannelSearchSource = any;
  export type MessageSearchSource = any;
  export type SearchController = any;
  export type UserSearchSource = any;
  export type StateStore = any;
  export type formatMessage = any;
  export interface LinkPreview {
    url: string;
    title: string;
    [k: string]: any;
  }
  export class LinkPreviewsManager {
    constructor(limit?: number);
    fetch(url: string): Promise<LinkPreview>;
  }
  export type isVoteAnswer = any;
  export type isLocalAttachment = any;
  export type isLocalAudioAttachment = any;
  export type isLocalFileAttachment = any;
  export type isLocalImageAttachment = any;
  export type isLocalVideoAttachment = any;
  export type isLocalVoiceRecordingAttachment = any;
  export type isLocalUploadAttachment = any;
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



