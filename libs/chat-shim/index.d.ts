declare module 'stream-chat' {
  /** Local replacement for Stream’s client */
  export class LocalChatClient {
    connectUser(user: { id: string }, jwt: string): Promise<void>;
    channel(type: string, id: string): any;
    disconnectUser(): void;
    devToken(uid: string): string;
    getUserAgent(): string;
    setUserAgent(ua: string): void;
    threads: {
      registerSubscriptions(): void;
      unregisterSubscriptions(): void;
    };
    polls: {
      store: StateStore<{ polls: any[] }>;
      registerSubscriptions(): void;
      unregisterSubscriptions(): void;
    };
  }

  /** Compatibility singleton (mimics StreamChat.getInstance) */
  export class StreamChat extends LocalChatClient {
    static getInstance(apiKey?: string): StreamChat;
  }

  /** Convenience helper */
  export function getLocalClient(): LocalChatClient;

  /** Channel objects the UI works with (aliased to our LocalChannel). */
  export class LocalChannel {
    readonly cid: string;
    readonly state: {
      messages: any[];
      messagePagination: { hasPrev: boolean; hasNext: boolean };
      read: Record<string, any>;
      watchers: Record<string, any>;
      members: Record<string, any>;
      pinnedMessages: any[];
      typing: Record<string, any>;
      threads: Record<string, any[]>;
      addMessageSorted(msg: any): void;
      filterErrorMessages(): void;
      removeMessage(msg: any): void;
    };
    readonly stateStore: StateStore<typeof this.state>;
    watch(): Promise<LocalChannel>;
    sendMessage(msg: { text: string }): Promise<void>;
    on(evt: string, cb: (ev: any) => void): { unsubscribe(): void };
    off(evt: string, cb: (ev: any) => void): void;
    markRead(): void;
    getConfig(): { typing_events: boolean; read_events: boolean };
  }

  export type Channel = LocalChannel;
  
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
  export interface SearchSourceState {
    isLoading: boolean;
  }
  export enum SearchSourceType {
    channel = 'channel',
    message = 'message',
    user = 'user',
  }
  export interface SearchSource {
    type: SearchSourceType;
    state: StateStore<SearchSourceState>;
    query(text: string): Promise<any[]>;
  }
  export abstract class BaseSearchSource implements SearchSource {
    readonly state: StateStore<SearchSourceState>;
    abstract type: SearchSourceType;
    constructor(client: any);
    query(text: string): Promise<any[]>;
  }
  export class ChannelSearchSource extends BaseSearchSource {}
  export class MessageSearchSource extends BaseSearchSource {}
  export class UserSearchSource extends BaseSearchSource {}
  export interface SearchControllerState {
    focusedMessage?: any;
    sources: SearchSource[];
  }
  export class SearchController {
    readonly state: StateStore<SearchControllerState>;
    readonly _internalState: StateStore<SearchControllerState>;
    constructor(opts?: { sources?: SearchSource[] });
    query(query: string): Promise<any[]>;
  }
  export class StateStore<T = any> {
    constructor(init: T);
    getState(): T;
    getLatestValue(): T;
    subscribe(cb: () => void): () => void;
    subscribeWithSelector<O>(selector: (v: T) => O, cb: () => void): () => void;
    dispatch(patch: Partial<T>): void;
    partialNext(patch: Partial<T>): void;
    next(patch: Partial<T>): void;
  }
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
  export interface Poll {
    id: string;
    question: string;
    user_id?: string;
    created_at?: string;
  }
  export interface PollOption {
    id: string;
    poll_id: string;
    text: string;
    user_id?: string;
    created_at?: string;
  }
  export interface PollState {
    poll: Poll;
    options: PollOption[];
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



