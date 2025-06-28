declare module 'stream-chat' {
  /** Local replacement for Stream’s client */
  export class LocalChatClient {
    user: { id: string } | undefined;
    state: { channels: Map<string, any> };
    wsConnection: { online: boolean };
    connectUser(user: { id: string }, jwt: string): Promise<void>;
    queryUsers(): Promise<{ users: { id: string }[] }>;
    channel(type: string, id?: string): any;
    disconnectUser(): void;
    deleteMessage(id: string): Promise<any>;
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
    reminders: ReminderManager;
    notifications: {
      store: StateStore<{ notifications: any[] }>;
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
  export class ChannelState {
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
    countUnread(userId: string): number;
  }

  export class LocalChannel {
    readonly type: string;
    readonly id: string;
    readonly cid: string;
    readonly state: ChannelState;
    readonly stateStore: StateStore<ChannelState>;
    readonly messageComposer: MessageComposer;
    watch(): Promise<LocalChannel>;
    sendMessage(msg: { text: string }): Promise<void>;
    on(evt: string, cb: (ev: any) => void): { unsubscribe(): void };
    off(evt: string, cb: (ev: any) => void): void;
    markRead(): void;
    countUnread(): number;
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
  export function useStateStore<T, O = T>(
    store:
      | StateStore<T>
      | {
          subscribe?: (cb: () => void) => () => void;
          getLatestValue?: () => T;
          getSnapshot?: () => T;
        }
      | undefined,
    selector?: (v: T) => O,
  ): O | undefined;
  export function formatMessage(text: string): string;
  export interface LinkPreview {
    url: string;
    title: string;
    status?: LinkPreviewStatus;
    [k: string]: any;
  }
  export class LinkPreviewsManager {
    constructor(limit?: number);
    fetch(url: string): Promise<LinkPreview>;
    dismissPreview(url: string): void;
    static previewIsLoading(p: LinkPreview): boolean;
    static previewIsLoaded(p: LinkPreview): boolean;
    static previewIsDismissed(p: LinkPreview): boolean;
    static previewIsFailed(p: LinkPreview): boolean;
    static previewIsPending(p: LinkPreview): boolean;
    static getPreviewData(p: LinkPreview): Omit<LinkPreview, 'status'>;
  }
  export enum LinkPreviewStatus {
    dismissed = 'dismissed',
    failed = 'failed',
    loaded = 'loaded',
    loading = 'loading',
    pending = 'pending',
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

  export interface Reminder {
    id: string;
    text: string;
    remind_at: string;
  }

  export interface ReminderState {
    reminder: Reminder;
    timer?: ReturnType<typeof setTimeout>;
  }

  export interface ReminderManagerState {
    reminders: ReminderState[];
  }

  export class ReminderManager {
    readonly store: StateStore<ReminderManagerState>;
    registerSubscriptions(): void;
    unregisterSubscriptions(): void;
    initTimers(): void;
    createReminder(text: string, remind_at: string): Promise<Reminder>;
    clearTimers(): void;
  }
  export class FixedSizeQueueCache<K, T> {
    constructor(size: number, options?: { dispose: (key: K, value: T) => void });
    add(key: K, value: T): void;
    peek(key: K): T | undefined;
    get(key: K): T | undefined;
  }
  export interface MessageComposerState {
    text: string;
    attachments: any[];
  }
  export interface MessageComposerConfig {
    [k: string]: any;
  }
  export class MessageComposer {
    contextType: 'message';
    state: MessageComposerState;
    /** configuration for the composer, e.g. accepted file types */
    configState: StateStore<MessageComposerConfig>;
    attachmentManager: {
      state: StateStore<AttachmentManagerState>;
      availableUploadSlots: number;
      addFiles(files: File[]): Promise<void>;
      removeAttachment(id: string): void;
      replaceAttachment(oldAtt: any, newAtt: any): void;
    };
    linkPreviewsManager: {
      state: StateStore<LinkPreviewsManagerState>;
      add(url: string): Promise<LinkPreview>;
      remove(url: string): void;
      clear(): void;
    };
    reset(): void;
    setText(text: string): void;
    addAttachment(att: any): void;
    submit(send?: (text: string) => void): void;
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



