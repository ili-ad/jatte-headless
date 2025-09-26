import React from 'react';
import { FormDialog } from '../../Dialog/FormDialog';
import { useChatContext, usePollContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { castVote } from '../../../chatSDKShim';
import type { PollOption, PollState } from 'chat-shim';

type PollStateSelectorReturnValue = { options: PollOption[] };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  options: nextValue.options,
});

export type SuggestPollOptionFormProps = {
  close: () => void;
  messageId: string;
};

export const SuggestPollOptionForm = ({
  close,
  messageId,
}: SuggestPollOptionFormProps) => {
  const { client } = useChatContext('SuggestPollOptionForm');
  const { t } = useTranslationContext('SuggestPollOptionForm');
  const { poll } = usePollContext();
  const { options } = useStateStore(poll.state, pollStateSelector);

  return (
    <FormDialog<{ optionText: '' }>
      className='str-chat__prompt-dialog str-chat__modal__suggest-poll-option'
      close={close}
      fields={{
        optionText: {
          element: 'input',
          props: {
            id: 'optionText',
            name: 'optionText',
            required: true,
            type: 'text',
            value: '',
          },
          validator: (value) => {
            if (!value) return;
            const existingOption = options.find(
              (option) => option.text === (value as string).trim(),
            );
            if (existingOption) {
              return new Error(t('Option already exists'));
            }
            return;
          },
        },
      }}
      onSubmit={async (value) => {
        const createPollOption = (client as {
          createPollOption?: (id: string, payload: { text: string }) => Promise<any>;
        }).createPollOption;
        if (typeof createPollOption !== 'function') return;
        const created = await createPollOption(poll.id, { text: value.optionText });
        const pollOption = created?.poll_option ?? created;
        if (!pollOption?.id) return;
        return castVote({
          poll,
          optionId: String(pollOption.id),
          messageId,
          userId: client.user?.id ?? 'me',
          user: client.user,
        });
      }}
      shouldDisableSubmitButton={(value) => !value.optionText}
      title={t('Suggest an option')}
    />
  );
};
