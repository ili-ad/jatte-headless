import React from 'react';
import type { Attachment } from 'chat-shim';

export type UnsupportedAttachmentProps = {
  attachment: Attachment;
};

export const UnsupportedAttachment = ({ attachment }: UnsupportedAttachmentProps) => (
  <div data-testid="unsupported-attachment">{attachment.title ?? 'Unsupported attachment'}</div>
);
