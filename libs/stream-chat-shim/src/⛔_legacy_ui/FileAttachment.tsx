import React from 'react';
import type { Attachment } from 'chat-shim';

export type FileAttachmentProps = {
  attachment: Attachment;
};

/**
 * Placeholder FileAttachment component used in place of Stream Chat's
 * implementation. It simply renders the attachment title or name.
 */
export const FileAttachment = ({ attachment }: FileAttachmentProps) => (
  <div data-testid="file-attachment-placeholder">
    {attachment?.title ?? attachment?.name ?? 'File'}
  </div>
);
