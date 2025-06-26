// libs/stream-chat-shim/src/attachment-utils.tsx
import type { ReactNode } from 'react';
import type { Attachment } from 'stream-chat';

export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
] as const;

export type AttachmentComponentType =
  | 'card'
  | 'gallery'
  | 'image'
  | 'media'
  | 'audio'
  | 'voiceRecording'
  | 'file'
  | 'unsupported';

export type GroupedRenderedAttachment = Record<AttachmentComponentType, ReactNode[]>;

export type GalleryAttachment = {
  images: Attachment[];
  type: 'gallery';
};

// internal placeholder for props from Attachment component
type AttachmentProps = any;

export type RenderAttachmentProps = Omit<AttachmentProps, 'attachments'> & {
  attachment: Attachment;
};

export type RenderGalleryProps = Omit<AttachmentProps, 'attachments'> & {
  attachment: GalleryAttachment;
};

export const isGalleryAttachmentType = (
  attachment: Attachment | GalleryAttachment,
): attachment is GalleryAttachment =>
  Array.isArray((attachment as GalleryAttachment).images);

export const isSvgAttachment = (attachment: Attachment) => {
  const filename = attachment.fallback || '';
  return filename.toLowerCase().endsWith('.svg');
};

export const divMod = (num: number, divisor: number) => [
  Math.floor(num / divisor),
  num % divisor,
];

export const displayDuration = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds < 0) return '00:00';

  const [hours, hoursLeftover] = divMod(totalSeconds, 3600);
  const [minutes, seconds] = divMod(hoursLeftover, 60);
  const roundedSeconds = Math.ceil(seconds);

  const prependHrsZero = hours.toString().length === 1 ? '0' : '';
  const prependMinZero = minutes.toString().length === 1 ? '0' : '';
  const prependSecZero = roundedSeconds.toString().length === 1 ? '0' : '';
  const minSec = `${prependMinZero}${minutes}:${prependSecZero}${roundedSeconds}`;

  return hours ? `${prependHrsZero}${hours}:` + minSec : minSec;
};
