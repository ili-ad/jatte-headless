import React from 'react';
import { useChatContext, useMessageContext, useTranslationContext } from '../../context';
import { chatAPI, type CreateReminderInput } from '../../api/chatAPI';
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
  const { client, channel } = useChatContext();
  const { message } = useMessageContext();
  const scheduledOffsetsMs = chatAPI.reminders.scheduledOffsetsMs({ client });
  const cid = channel?.cid ?? (message.cid as string | undefined);
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
            if (!cid) return;
            const remindAt = new Date(Date.now() + offsetMs).toISOString();
            const rawMessageId =
              typeof message.id === 'number'
                ? message.id
                : typeof message.id === 'string'
                ? Number.parseInt(message.id, 10)
                : undefined;
            const reminderInput: CreateReminderInput = {
              cid,
              remind_at: remindAt,
            };
            if (typeof rawMessageId === 'number' && !Number.isNaN(rawMessageId)) {
              reminderInput.message_id = rawMessageId;
            }
            void chatAPI.reminders.upsertReminder({
              client,
              reminder: reminderInput,
            });
          }}
        >
          {t('duration/Remind Me', { milliseconds: offsetMs })}
        </button>
      ))}
      {/* todo: potential improvement to add a custom option that would trigger rendering modal with custom date picker - we need date picker */}
    </div>
  );
};
