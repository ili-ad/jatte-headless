import React from 'react';
/* TODO backend-wire-up: Attachment import excised */
type Attachment = any;

import { FileIcon } from '../ReactFileUtilities';
import { useTranslationContext } from '../../context';

export type UnsupportedAttachmentProps = {
  attachment: Attachment;
};

export const UnsupportedAttachment = ({ attachment }: UnsupportedAttachmentProps) => {
  const { t } = useTranslationContext('UnsupportedAttachment');
  return (
    <div
      className='str-chat__message-attachment-unsupported'
      data-testid='attachment-unsupported'
    >
      <FileIcon className='str-chat__file-icon' />
      <div className='str-chat__message-attachment-unsupported__metadata'>
        <div
          className='str-chat__message-attachment-unsupported__title'
          data-testid='unsupported-attachment-title'
        >
          {attachment.title || t('Unsupported attachment')}
        </div>
      </div>
    </div>
  );
};
