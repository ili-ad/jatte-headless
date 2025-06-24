import React from 'react';

export const ATTACHMENT_GROUPS_ORDER = [
  'card',
  'gallery',
  'image',
  'media',
  'audio',
  'voiceRecording',
  'file',
  'unsupported',
] as const;

export type AttachmentProps = {
  attachments: any[];
  actionHandler?: (...args: any[]) => any;
  AttachmentActions?: React.ComponentType<any>;
  Audio?: React.ComponentType<any>;
  Card?: React.ComponentType<any>;
  File?: React.ComponentType<any>;
  Gallery?: React.ComponentType<any>;
  Image?: React.ComponentType<any>;
  isQuoted?: boolean;
  Media?: React.ComponentType<any>;
  UnsupportedAttachment?: React.ComponentType<any>;
  VoiceRecording?: React.ComponentType<any>;
};

export const Attachment = (_props: AttachmentProps) => {
  throw new Error('Attachment shim not implemented');
};
