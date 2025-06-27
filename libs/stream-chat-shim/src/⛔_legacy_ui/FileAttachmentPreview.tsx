import React from 'react';
import type {
  LocalAudioAttachment,
  LocalFileAttachment,
  LocalVideoAttachment,
  LocalUploadAttachment,
} from 'chat-shim';

/**
 * Props for {@link FileAttachmentPreview} component. Mirrors the Stream Chat
 * implementation but with the minimal fields required for the placeholder.
 */
export type FileAttachmentPreviewProps<CustomLocalMetadata = unknown> = {
  attachment:
    | LocalFileAttachment<CustomLocalMetadata>
    | LocalAudioAttachment<CustomLocalMetadata>
    | LocalVideoAttachment<CustomLocalMetadata>;
  handleRetry?: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments?: (ids: string[]) => void;
};

/**
 * Placeholder FileAttachmentPreview component used while porting the real
 * implementation from `stream-chat-react`.
 */
export const FileAttachmentPreview = (
  props: FileAttachmentPreviewProps,
) => {
  const { attachment } = props;
  return (
    <div data-testid="file-attachment-preview-placeholder">
      {attachment?.title ?? 'File Attachment'}
    </div>
  );
};

export default FileAttachmentPreview;
