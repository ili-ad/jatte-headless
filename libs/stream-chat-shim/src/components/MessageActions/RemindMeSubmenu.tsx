import React from 'react';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import {
  remindersScheduledOffsetsMs,
  remindersUpsertReminder,
} from '../../chatSDKShim';
import { ButtonWithSubmenu } from '../Dialog';
import type { ComponentProps } from 'react';

export const RemindMeActionButton = ({
  className,
  isMine,
}: { isMine: boolean } & ComponentProps<'button'>) => {
  const { t } = useTranslationContext();

  return (
    <ButtonWithSubmenu
      aria-selected='false'
      className={className}
      placement={isMine ? 'left-start' : 'right-start'}
      Submenu={RemindMeSubmenu}
    >
      {t('Remind Me')}
    </ButtonWithSubmenu>
  );
};

export const RemindMeSubmenu = () => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const scheduledOffsetsMs = remindersScheduledOffsetsMs(client);
  return (
    <div
      aria-label={t('aria/Remind Me Options')}
      className='str-chat__message-actions-box__submenu'
      role='listbox'
    >
      {scheduledOffsetsMs.map((offsetMs) => (
        <button
          className='str-chat__message-actions-list-item-button'
          key={`reminder-offset-option--${offsetMs}`}
          onClick={() => {
            remindersUpsertReminder(
              client.reminders,
              message.id,
              new Date(Date.now() + offsetMs).toISOString(),
            );
          }}
        >
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </button>
      ))}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>
  );
};
