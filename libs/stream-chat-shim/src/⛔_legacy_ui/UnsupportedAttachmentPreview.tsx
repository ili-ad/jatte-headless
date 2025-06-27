import React from 'react';
import type { AnyLocalAttachment, LocalUploadAttachment } from 'chat-shim';

export type UnsupportedAttachmentPreviewProps<
  CustomLocalMetadata = Record<string, unknown>,
> = {
  attachment: AnyLocalAttachment<CustomLocalMetadata>;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

/** Placeholder implementation of the UnsupportedAttachmentPreview component. */
export const UnsupportedAttachmentPreview = (
  { attachment }: UnsupportedAttachmentPreviewProps,
): React.JSX.Element => (
  <div
    className="str-chat__attachment-preview-unsupported"
    data-testid="attachment-preview-unsupported"
  >
    {attachment.title ?? 'Unsupported attachment'}
  </div>
);

export default UnsupportedAttachmentPreview;
