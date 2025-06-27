// import type { LocalUploadAttachment } from 'stream-chat'; // TODO backend-wire-up

type LocalUploadAttachment = any;


export type UploadAttachmentPreviewProps<A extends LocalUploadAttachment> = {
  attachment: A;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};
