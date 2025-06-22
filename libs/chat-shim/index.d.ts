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
  export function isLocalAttachment(a: any): boolean;
  export function isLocalUploadAttachment(a: any): boolean;
  export function isLocalImageAttachment(a: any): boolean;
  export function isLocalVideoAttachment(a: any): boolean;
  export function isLocalAudioAttachment(a: any): boolean;
  export function isLocalVoiceRecordingAttachment(a: any): boolean;
  export function isLocalFileAttachment(a: any): boolean;
  //export type  = any;
  export function localMessageToNewMessagePayload(local: LocalMessage): Message;
  export type ChannelSearchSource = any;
  export type MessageSearchSource = any;
  export type SearchController = any;
  export type UserSearchSource = any;
  export type StateStore = any;
  export function formatMessage(text: string): string;
  export interface LinkPreview {
    url: string;
    title: string;
    [k: string]: any;
  }
  export class LinkPreviewsManager {
    constructor(limit?: number);
    fetch(url: string): Promise<LinkPreview>;
  }
  export interface LinkPreviewsManagerState {
    previews: Map<string, LinkPreview>;
  }

  export interface AttachmentManagerState {
    attachments: any[];
  }
  export type PollVote = {
    id: string;
    poll_id: string;
    created_at: string;
    updated_at: string;
    option_id?: string;
    user?: UserResponse;
    user_id?: string;
  };
  export type PollAnswer = Omit<PollVote, 'option_id'> & {
    answer_text: string;
    is_answer: boolean;
  };
  export function isVoteAnswer(vote: PollVote | PollAnswer): vote is PollAnswer;
  export class FixedSizeQueueCache<T> {
    constructor(limit: number);
    enqueue(item: T): void;
    dequeue(): T | undefined;
    readonly size: number;
  }
  export interface MessageComposerState {
    text: string;
    attachments: any[];
  }
  export class MessageComposer {
    state: MessageComposerState;
    reset(): void;
    setText(text: string): void;
    addAttachment(att: any): void;
  }
  export enum VotingVisibility {
    anonymous = 'anonymous',
    public = 'public',
  }
  export type BaseSearchSource = any;
  export type getTokenizedSuggestionDisplayName = any;
  export function getTriggerCharWithToken(
    text: string,
    triggers?: string[]
  ): string;
  export function insertItemWithTrigger<T>(
    text: T,
    item: string,
    triggers?: string[]
  ): T;
  export function replaceWordWithEntity<T>(
    text: T,
    word: string,
    entity: string
  ): T;
  export type ToastNotification = {
    type: 'toast';
    text: string;
  };
  export type BannerNotification = {
    type: 'banner';
    text: string;
  };
  export type Notification = ToastNotification | BannerNotification;
  export interface NotificationManagerState {
    notifications: Notification[];
  }
}



