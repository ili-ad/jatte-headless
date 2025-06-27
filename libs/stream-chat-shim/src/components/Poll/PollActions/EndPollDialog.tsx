import { PromptDialog } from '../../Dialog/PromptDialog';
import React from 'react';
// import { usePollContext, useTranslationContext } from '../../../context'; // TODO backend-wire-up
const usePollContext = () => ({ poll: { close: () => {} } } as any); // temporary shim
const useTranslationContext = (_componentName?: string) => ({ t: (s: string) => s }); // temporary shim

export type EndPollDialogProps = {
  close: () => void;
};

export const EndPollDialog = ({ close }: EndPollDialogProps) => {
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const { poll } = usePollContext();

  return (
    <PromptDialog
      actions={[
        {
          children: t('Cancel'),
          className: 'str-chat__dialog__controls-button--cancel',
          onClick: close,
        },
        {
          children: t('End'),
          className:
            'str-chat__dialog__controls-button--submit str-chat__dialog__controls-button--end-poll',
          onClick: poll.close,
        },
      ]}
      className='str-chat__modal__end-vote'
      prompt={t('Nobody will be able to vote in this poll anymore.')}
      title={t('End vote')}
    />
  );
};
