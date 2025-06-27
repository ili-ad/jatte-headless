import type { Attachment } from 'chat-shim';

// Simplified sizing helpers. Real logic from stream-chat-react is omitted.
// Returns a basic configuration object for image attachments.
export const getImageAttachmentConfiguration = (
  attachment: Attachment,
  _element: HTMLElement,
) => {
  return {
    url: attachment.image_url || attachment.thumb_url || '',
  };
};

// Returns a basic configuration object for video attachments.
export const getVideoAttachmentConfiguration = (
  attachment: Attachment,
  _element: HTMLElement,
  _shouldGenerateVideoThumbnail: boolean,
) => {
  return {
    thumbUrl: attachment.thumb_url,
    url: attachment.asset_url || '',
  };
};
