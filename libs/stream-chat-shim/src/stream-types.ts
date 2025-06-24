// Placeholder type definitions used across the Stream UI shims.
// These should be replaced with real types once the original
// implementations are ported.

export interface DefaultStreamChatGenerics {
  attachmentType?: unknown;
  channelType?: unknown;
  commandType?: unknown;
  eventType?: unknown;
  messageType?: unknown;
  reactionType?: unknown;
  userType?: unknown;
}

/** Generic map for unknown values. */
export type UnknownType = Record<string, any>;

/** Minimal representation of a chat user. */
export interface UserResponse {
  id: string;
  [key: string]: any;
}

/** Minimal representation of a chat message. */
export interface StreamMessage<T = UnknownType> {
  id?: string;
  text?: string;
  user?: UserResponse;
  attachments?: T[];
  [key: string]: any;
}

/** Minimal representation of a channel. */
export interface Channel<T = UnknownType> {
  id: string;
  type: string;
  cid?: string;
  data?: T;
  [key: string]: any;
}
