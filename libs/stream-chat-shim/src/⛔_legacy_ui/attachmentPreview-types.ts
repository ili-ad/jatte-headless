// Shim for AttachmentPreviewList/types.ts
// Provides type definitions used by AttachmentPreviewList components.

// Placeholder generic defaults used by other stream-chat-react types.
type DefaultStreamChatGenerics = {
  attachmentType?: unknown;
  channelType?: unknown;
  commandType?: unknown;
  eventType?: unknown;
  messageType?: unknown;
  reactionType?: unknown;
  userType?: unknown;
};

// Placeholder representation of a local attachment object.
type LocalAttachment<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Record<string, unknown>;

export type AttachmentPreviewProps<
  A extends LocalAttachment,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  attachment: A;
  handleRetry: (
    attachment: LocalAttachment<StreamChatGenerics>,
  ) => void | Promise<LocalAttachment<StreamChatGenerics> | undefined>;
  removeAttachments: (ids: string[]) => void;
};
