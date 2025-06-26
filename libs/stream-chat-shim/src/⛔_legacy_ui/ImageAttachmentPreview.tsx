import React from 'react';
import type { Attachment } from 'stream-chat';

export type ImageAttachmentPreviewProps = {
  attachment: Attachment;
  onRemove?: (attachment: Attachment) => void;
};

/**
 * Placeholder component for image attachments in the message input preview list.
 * TODO: replace with real implementation.
 */
export const ImageAttachmentPreview = ({ attachment }: ImageAttachmentPreviewProps) => (
  <div data-testid="image-attachment-preview-placeholder">
    {attachment?.title || attachment?.name || 'Image'}
  </div>
);

export default ImageAttachmentPreview;
