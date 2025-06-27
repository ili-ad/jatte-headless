import 'chat-shim';

/** Default interface shapes used by the Stream Chat types. */
export interface DefaultChannelData { image?: string; name?: string; subtitle?: string; }
export interface DefaultAttachmentData {}
export interface DefaultCommandData {}
export interface DefaultEventData {}
export interface DefaultMemberData {}
export interface DefaultMessageData {}
export interface DefaultPollOptionData {}
export interface DefaultPollData {}
export interface DefaultReactionData {}
export interface DefaultUserData {}
export interface DefaultThreadData {}

/** Augment the `stream-chat` module with our custom data interfaces. */
declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {}
  interface CustomAttachmentData extends DefaultAttachmentData {}
  interface CustomCommandData extends DefaultCommandData {}
  interface CustomEventData extends DefaultEventData {}
  interface CustomMemberData extends DefaultMemberData {}
  interface CustomMessageData extends DefaultMessageData {}
  interface CustomPollOptionData extends DefaultPollOptionData {}
  interface CustomPollData extends DefaultPollData {}
  interface CustomReactionData extends DefaultReactionData {}
  interface CustomUserData extends DefaultUserData {}
  interface CustomThreadData extends DefaultThreadData {}
}
