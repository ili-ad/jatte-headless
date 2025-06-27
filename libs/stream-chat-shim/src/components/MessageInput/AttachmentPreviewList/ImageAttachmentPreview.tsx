import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
// import { CloseIcon, LoadingIndicatorIcon, RetryIcon } from '../icons'; // TODO backend-wire-up
const CloseIcon = () => null;
const LoadingIndicatorIcon = (_props: any) => null;
const RetryIcon = () => null;
// import { BaseImage as DefaultBaseImage } from '../../Gallery'; // TODO backend-wire-up
const DefaultBaseImage = (props: any) => <img {...props} />;
// import { useComponentContext, useTranslationContext } from '../../../context'; // TODO backend-wire-up
const useComponentContext = (_?: string) => ({ BaseImage: DefaultBaseImage });
const useTranslationContext = (_?: string) => ({ t: (s: any) => s });
// import type { LocalImageAttachment } from 'stream-chat'; // TODO backend-wire-up
import type { LocalImageAttachment } from '../../../../../chat-shim';
import type { UploadAttachmentPreviewProps } from './types';

export type ImageAttachmentPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalImageAttachment<CustomLocalMetadata>>;

export const ImageAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentPreviewProps) => {
  const { t } = useTranslationContext('ImagePreviewItem');
  const { BaseImage = DefaultBaseImage } = useComponentContext('ImagePreview');
  const [previewError, setPreviewError] = useState(false);

  const { id, uploadState } = attachment.localMetadata ?? {};

  const handleLoadError = useCallback(() => setPreviewError(true), []);
  const assetUrl = attachment.image_url || attachment.localMetadata.previewUri;

  return (
    <div
      className={clsx('str-chat__attachment-preview-image', {
        'str-chat__attachment-preview-image--error': previewError,
      })}
      data-testid='attachment-preview-image'
    >
      <button
        aria-label={t('aria/Remove attachment')}
        className='str-chat__attachment-preview-delete'
        data-testid='image-preview-item-delete-button'
        disabled={uploadState === 'uploading'}
        onClick={() => id && removeAttachments([id])}
      >
        <CloseIcon />
      </button>

      {['blocked', 'failed'].includes(uploadState) && (
        <button
          className='str-chat__attachment-preview-error str-chat__attachment-preview-error-image'
          data-testid='image-preview-item-retry-button'
          onClick={() => handleRetry(attachment)}
        >
          <RetryIcon />
        </button>
      )}

      {uploadState === 'uploading' && (
        <div className='str-chat__attachment-preview-image-loading'>
          <LoadingIndicatorIcon size={17} />
        </div>
      )}

      {assetUrl && (
        <BaseImage
          alt={attachment.fallback}
          className='str-chat__attachment-preview-thumbnail'
          onError={handleLoadError}
          src={assetUrl}
          title={attachment.fallback}
        />
      )}
    </div>
  );
};
