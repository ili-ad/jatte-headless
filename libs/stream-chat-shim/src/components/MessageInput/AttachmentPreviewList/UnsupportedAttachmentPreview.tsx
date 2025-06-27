import React from 'react';
// import { isLocalUploadAttachment } from 'stream-chat'; // TODO backend-wire-up
import { isLocalUploadAttachment } from '../../../../../chat-shim';
// import { CloseIcon, DownloadIcon, LoadingIndicatorIcon, RetryIcon } from '../icons'; // TODO backend-wire-up
const CloseIcon = () => null;
const DownloadIcon = () => null;
const LoadingIndicatorIcon = (_props: any) => null;
const RetryIcon = () => null;
// import { FileIcon } from '../../ReactFileUtilities'; // TODO backend-wire-up
const FileIcon = (_props: any) => null;
// import { useTranslationContext } from '../../../context'; // TODO backend-wire-up
const useTranslationContext = (_?: string) => ({ t: (s: any) => s });
// import type { AnyLocalAttachment, LocalUploadAttachment } from 'stream-chat'; // TODO backend-wire-up
import type { AnyLocalAttachment, LocalUploadAttachment } from '../../../../../chat-shim';

export type UnsupportedAttachmentPreviewProps<
  CustomLocalMetadata = Record<string, unknown>,
> = {
  attachment: AnyLocalAttachment<CustomLocalMetadata>;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

export const UnsupportedAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: UnsupportedAttachmentPreviewProps) => {
  const { t } = useTranslationContext('UnsupportedAttachmentPreview');
  const title = attachment.title ?? t('Unsupported attachment');
  return (
    <div
      className='str-chat__attachment-preview-unsupported'
      data-testid='attachment-preview-unknown'
    >
      <div className='str-chat__attachment-preview-file-icon'>
        <FileIcon filename={title} mimeType={attachment.mime_type} />
      </div>

      <button
        aria-label={t('aria/Remove attachment')}
        className='str-chat__attachment-preview-delete'
        data-testid='file-preview-item-delete-button'
        disabled={attachment.localMetadata?.uploadState === 'uploading'}
        onClick={() =>
          attachment.localMetadata?.id &&
          removeAttachments([attachment.localMetadata?.id])
        }
      >
        <CloseIcon />
      </button>

      {isLocalUploadAttachment(attachment) &&
        ['blocked', 'failed'].includes(attachment.localMetadata?.uploadState) &&
        !!handleRetry && (
          <button
            className='str-chat__attachment-preview-error str-chat__attachment-preview-error-file'
            data-testid='file-preview-item-retry-button'
            onClick={() => handleRetry(attachment)}
          >
            <RetryIcon />
          </button>
        )}

      <div className='str-chat__attachment-preview-metadata'>
        <div className='str-chat__attachment-preview-title' title={title}>
          {title}
        </div>
        {attachment.localMetadata?.uploadState === 'finished' &&
          !!attachment.asset_url && (
            <a
              className='str-chat__attachment-preview-file-download'
              download
              href={attachment.asset_url}
              rel='noreferrer'
              target='_blank'
            >
              <DownloadIcon />
            </a>
          )}
        {attachment.localMetadata?.uploadState === 'uploading' && (
          <LoadingIndicatorIcon size={17} />
        )}
      </div>
    </div>
  );
};
