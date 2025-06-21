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


  declare module 'stream-chat' {
    // …

    // LAST resort: anything not declared above falls back to `any`
    // (comment/remove when you switch to the smarter script below)
    export type _Any = any;        // <- dummy so the line below compiles
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    export interface _Wildcard { [K: string]: any }   // 👈 wildcard types
  }

  /** Convenience helper */
  export function getLocalClient(): LocalChatClient;

  /** Channel objects the UI works with (aliased to our LocalChannel). */
  //export type Channel = import('../../libs/chat-shim').LocalChannel; 
  // frontend/types/stream-chat-shim.d.ts  (or libs/chat‑shim/index.d.ts if you copy)
  export type Channel = {
    /** Stream channel id, e.g. "messaging:general" */
    cid: string;                 //  🆕  ← matches the runtime change
    watch(): Promise<Channel>;
    sendMessage(msg: { text: string }): Promise<void>;
    /** Attaches a listener and returns an object with `unsubscribe()` */
    on(
      evt: string,
      cb: (ev: any) => void
    ): { unsubscribe(): void };
    off(evt: string, cb: (ev: any) => void): void;
    markRead(): void;
  };

  
  export type AIState = any;
  export type Event    = any;
  export type Reaction = any;
  export type UserResponse = any;
  //export type isAudioAttachment = any;
  //export type isFileAttachment = any;
  //export type isImageAttachment = any;
  //export type isScrapedContent = any;
  //export type isVideoAttachment = any;
  //export type isVoiceRecordingAttachment = any;
  //export type  = any;
  export type localMessageToNewMessagePayload = any;
  export type ChannelSearchSource = any;
  export type MessageSearchSource = any;
  export type SearchController = any;
  export type UserSearchSource = any;
  export type StateStore = any;
  //export type formatMessage = any;
  export type LinkPreviewsManager = any;
  export type isVoteAnswer = any;
  //export type isLocalAttachment = any;
  //export type isLocalAudioAttachment = any;
  //export type isLocalFileAttachment = any;
  //export type isLocalImageAttachment = any;
  //export type isLocalVideoAttachment = any;
  //export type isLocalVoiceRecordingAttachment = any;
  //export type isLocalUploadAttachment = any;
  export type FixedSizeQueueCache = any;
  export type MessageComposer = any;
  export type VotingVisibility = any;
  export type BaseSearchSource = any;
  //export type getTokenizedSuggestionDisplayName = any;
  //export type getTriggerCharWithToken = any;
  //export type insertItemWithTrigger = any;
  //export type replaceWordWithEntity = any;
  export type StreamChat = any;
  export type Attachment = any;
  export type Action = any;
  export type LocalAttachment = any;
  export type APIErrorResponse = any;
  export type ChannelAPIResponse = any;
  export type ChannelMemberResponse = any;
  export type ChannelQueryOptions = any;
  export type ChannelState = any;
  export type ErrorFromResponse = any;
  export type EventAPIResponse = any;
  export type LocalMessage = any;
  export type Message = any;
  export type MessageResponse = any;
  export type SendMessageAPIResponse = any;
  export type SendMessageOptions = any;
  export type UpdateMessageOptions = any;
  export type ChannelFilters = any;
  export type ChannelOptions = any;
  export type ChannelSort = any;
  export type SearchControllerState = any;
  export type EventTypes = any;
  export type ChannelSortBase = any;
  export type PollVote = any;
  export type TranslationLanguages = any;
  export type UserFilters = any;
  export type UserOptions = any;
  export type UsersAPIResponse = any;
  export type UserSort = any;
  export type AppSettingsAPIResponse = any;
  export type Mute = any;
  export type OwnUserResponse = any;
  export type StreamChatOptions = any;
  export type TokenOrProvider = any;
  export type Thread = any;
  export type ThreadManagerState = any;
  export type LocalVoiceRecordingAttachment = any;
  export type Reminder = any;
  export type ReminderState = any;
  export type ReminderManagerState = any;
  export type ReactionResponse = any;
  export type ReactionSort = any;
  export type User = any;
  export type ChannelConfigWithInfo = any;
  export type LocalMessageBase = any;
  export type LocalAudioAttachment = any;
  export type LocalFileAttachment = any;
  export type LocalVideoAttachment = any;
  export type LocalImageAttachment = any;
  export type AnyLocalAttachment = any;
  export type LocalUploadAttachment = any;
  export type LinkPreview = any;
  export type LinkPreviewsManagerState = any;
  export type MessageComposerState = any;
  export type UpdatedMessage = any;
  export type MessageComposerConfig = any;
  export type AttachmentManagerState = any;
  export type ChannelResponse = any;
  export type EditingAuditState = any;
  export type EventHandler = any;
  export type MessageLabel = any;
  export type Notification = any;
  export type NotificationManagerState = any;
  export type Poll = any;
  export type PollAnswer = any;
  export type PollState = any;
  export type PollOption = any;
  export type PollOptionVotesQueryParams = any;
  export type PollComposerState = any;
  export type PollAnswersQueryParams = any;
  export type ReactionGroupResponse = any;
  export type CommandResponse = any;
  export type SearchSourceState = any;
  export type TextComposerState = any;
  export type TextComposerSuggestion = any;
  export type ThreadState = any;
  export type UpdateMessageAPIResponse = any;
  export type SearchSource = any;
  export type SearchSourceType = any;
  export type InternalSearchControllerState = any;
  export type QueryChannelAPIResponse = any;
  export interface _Wildcard { [K: string]: any }


  // value helpers ------------------------------------------------------------
  export function isAudioAttachment(a: any): boolean;
  export function isFileAttachment(a: any): boolean;
  export function isImageAttachment(a: any): boolean;
  export function isVideoAttachment(a: any): boolean;
  export function isVoiceRecordingAttachment(a: any): boolean;
  export function isScrapedContent(a: any): boolean;
  export function isLocalAttachment(a: any): boolean;
  export function isLocalUploadAttachment(a: any): boolean;

  export function isLocalAudioAttachment(a:any): boolean;
  export function isLocalFileAttachment(a:any):  boolean;
  export function isLocalImageAttachment(a:any): boolean;
  export function isLocalVideoAttachment(a:any): boolean;
  export function isLocalVoiceRecordingAttachment(a:any): boolean;
  

  export function formatMessage(...a:any[]): string;
  export function getTokenizedSuggestionDisplayName(...a:any[]): string;
  export function getTriggerCharWithToken(...a:any[]): string;
  export function insertItemWithTrigger<T>(s:T): T;
  export function replaceWordWithEntity<T>(s:T): T;

  export class LinkPreviewsManager {}
  export class MessageComposer {}
  export class FixedSizeQueueCache {}
  export class SearchController {}



}


