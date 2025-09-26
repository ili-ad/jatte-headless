import React from 'react';
import { FormDialog } from '../../Dialog/FormDialog';
import { useStateStore } from '../../../store';
import { chatAPI } from '../../../api/chatAPI';
import {
  useChatContext,
  usePollContext,
  useTranslationContext,
} from '../../../context';
import type { PollAnswer, PollState } from 'chat-shim';

type PollStateSelectorReturnValue = { ownAnswer: PollAnswer | undefined };
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  ownAnswer: nextValue.ownAnswer,
});

type PollStateWithAnswers = PollState & {
  answers_count?: number;
  ownAnswer?: PollAnswer;
};

type PollStateStore = {
  dispatch?: (patch: Partial<PollStateWithAnswers>) => void;
  getLatestValue?: () => PollStateWithAnswers;
};

export type AddCommentFormProps = {
  close: () => void;
  messageId: string;
};

export const AddCommentForm = ({ close, messageId }: AddCommentFormProps) => {
  const { client } = useChatContext('AddCommentForm');
  const { t } = useTranslationContext('AddCommentForm');

  const { poll } = usePollContext();
  const { ownAnswer } = useStateStore(poll.state, pollStateSelector);
  const pollStateStore = poll.state as unknown as PollStateStore;

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
        const commentText = value.comment.trim();
        const addAnswerResponse = await chatAPI.addAnswer({
          poll_id: poll.id,
          text: commentText,
          extras: {
            answer_text: commentText,
            is_answer: true,
            message_id: messageId,
          },
        });

        const currentState = pollStateStore.getLatestValue?.();
        const previousOwnAnswer = currentState?.ownAnswer;
        const createdBy = (() => {
          if (typeof addAnswerResponse.created_by === 'number') {
            return String(addAnswerResponse.created_by);
          }
          if (typeof addAnswerResponse.created_by === 'string') {
            return addAnswerResponse.created_by;
          }
          if (typeof client.user?.id === 'number') {
            return String(client.user.id);
          }
          return client.user?.id;
        })();

        const responseDetails = addAnswerResponse as {
          answer_text?: unknown;
          is_answer?: unknown;
          updated_at?: string;
        };

        const answerTextValue =
          typeof responseDetails.answer_text === 'string'
            ? responseDetails.answer_text
            : commentText;

        const isAnswerValue =
          typeof responseDetails.is_answer === 'boolean'
            ? responseDetails.is_answer
            : true;

        const updatedAt = responseDetails.updated_at ?? addAnswerResponse.created_at;

        const updatedOwnAnswer: PollAnswer = {
          id: String(addAnswerResponse.id),
          poll_id: String(addAnswerResponse.poll_id),
          created_at: addAnswerResponse.created_at,
          updated_at: updatedAt,
          answer_text: answerTextValue,
          is_answer: isAnswerValue,
          user_id: createdBy,
        };

        if (client.user) {
          updatedOwnAnswer.user = client.user;
        }

        const answersCount = currentState?.answers_count;
        let nextAnswersCount: number | undefined = answersCount;

        if (typeof answersCount === 'number') {
          nextAnswersCount = previousOwnAnswer ? answersCount : answersCount + 1;
        } else if (!previousOwnAnswer) {
          nextAnswersCount = 1;
        }

        pollStateStore.dispatch?.({
          answers_count: nextAnswersCount,
          ownAnswer: updatedOwnAnswer,
        });

        return addAnswerResponse;
      }}
      shouldDisableSubmitButton={(value) =>
        !value.comment || value.comment === ownAnswer?.answer_text
      }
      title={ownAnswer ? t('Update your comment') : t('Add a comment')}
    />
  );
};
