import React from 'react';
import { FormDialog } from '../../Dialog/FormDialog';
import { useStateStore } from '../../../store';
import { usePollContext, useTranslationContext } from '../../../context';
import type { PollAnswer, PollState } from 'chat-shim';

type PollStateSelectorReturnValue = { ownAnswer: PollAnswer | undefined };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  ownAnswer: nextValue.ownAnswer,
});

export type AddCommentFormProps = {
  close: () => void;
  messageId: string;
};

export const AddCommentForm = ({ close, messageId }: AddCommentFormProps) => {
  const { t } = useTranslationContext('AddCommentForm');

  const { poll } = usePollContext();
  const { ownAnswer } = useStateStore(poll.state, pollStateSelector);

  return (
    <FormDialog<{ comment: '' }>
      className='str-chat__prompt-dialog str-chat__modal__poll-add-comment'
      close={close}
      fields={{
        comment: {
          element: 'input',
          props: {
            id: 'comment',
            name: 'comment',
            required: true,
            type: 'text',
            value: ownAnswer?.answer_text ?? '',
          },
        },
      }}
      onSubmit={async (value) => {
        /* TODO backend-wire-up: addAnswer */
        return Promise.resolve();
      }}
      shouldDisableSubmitButton={(value) =>
        !value.comment || value.comment === ownAnswer?.answer_text
      }
      title={ownAnswer ? t('Update your comment') : t('Add a comment')}
    />
  );
};
