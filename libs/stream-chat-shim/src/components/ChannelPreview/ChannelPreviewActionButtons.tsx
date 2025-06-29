import React from 'react';
import clsx from 'clsx';
import type { Channel } from 'chat-shim';

import { useChannelMembershipState } from '../ChannelList';
import { Icon } from './icons';
import { useTranslationContext } from '../../context';

import { channelUnpin } from '../../chatSDKShim';
export type ChannelPreviewActionButtonsProps = {
  channel: Channel;
};

export function ChannelPreviewActionButtons({
  channel,
}: ChannelPreviewActionButtonsProps) {
  const membership = useChannelMembershipState(channel);
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__channel-preview__action-buttons'>
      <button
        aria-label={membership.pinned_at ? t('Unpin') : t('Pin')}
        className={clsx(
          'str-chat__channel-preview__action-button',
          'str-chat__channel-preview__action-button--pin',
          membership.pinned_at && 'str-chat__channel-preview__action-button--active',
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (membership.pinned_at) {
            channelUnpin(channel);
          } else {
            /* TODO backend-wire-up: channel.pin */
          }
        }}
        title={membership.pinned_at ? t('Unpin') : t('Pin')}
      >
        <Icon.Pin />
      </button>
      <button
        aria-label={membership.archived_at ? t('Unarchive') : t('Archive')}
        className={clsx(
          'str-chat__channel-preview__action-button',
          'str-chat__channel-preview__action-button--archive',
          membership.archived_at && 'str-chat__channel-preview__action-button--active',
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (membership.archived_at) {
            /* TODO backend-wire-up: channel.unarchive */
          } else {
          }
        }}
        title={membership.archived_at ? t('Unarchive') : t('Archive')}
      >
        <Icon.ArchiveBox />
      </button>
    </div>
  );
}
