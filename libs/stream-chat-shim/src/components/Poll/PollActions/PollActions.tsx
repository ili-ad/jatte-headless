import React, { useCallback, useState } from 'react';
// import { PollAction } from './PollAction'; // TODO backend-wire-up
const PollAction = (() => null) as React.ComponentType<any>; // temporary shim
// import type { AddCommentFormProps } from './AddCommentForm'; // TODO backend-wire-up
type AddCommentFormProps = any;
// import { AddCommentForm as DefaultAddCommentForm } from './AddCommentForm'; // TODO backend-wire-up
const DefaultAddCommentForm = (() => null) as React.ComponentType<any>; // temporary shim
// import type { SuggestPollOptionFormProps } from './SuggestPollOptionForm'; // TODO backend-wire-up
type SuggestPollOptionFormProps = any;
// import { SuggestPollOptionForm as DefaultSuggestPollOptionForm } from './SuggestPollOptionForm'; // TODO backend-wire-up
const DefaultSuggestPollOptionForm = (() => null) as React.ComponentType<any>; // temporary shim
// import type { EndPollDialogProps } from './EndPollDialog'; // TODO backend-wire-up
type EndPollDialogProps = any;
// import { EndPollDialog as DefaultEndPollDialog } from './EndPollDialog'; // TODO backend-wire-up
const DefaultEndPollDialog = (() => null) as React.ComponentType<any>; // temporary shim
// import type { PollAnswerListProps } from './PollAnswerList'; // TODO backend-wire-up
type PollAnswerListProps = any;
// import { PollAnswerList as DefaultPollAnswerList } from './PollAnswerList'; // TODO backend-wire-up
const DefaultPollAnswerList = (() => null) as React.ComponentType<any>; // temporary shim
// import type { FullPollOptionsListingProps } from './PollOptionsFullList'; // TODO backend-wire-up
type FullPollOptionsListingProps = any;
// import { PollOptionsFullList as DefaultPollOptionsFullList } from './PollOptionsFullList'; // TODO backend-wire-up
const DefaultPollOptionsFullList = (() => null) as React.ComponentType<any>; // temporary shim
// import type { PollResultsProps } from './PollResults'; // TODO backend-wire-up
type PollResultsProps = any;
// import { PollResults as DefaultPollResults } from './PollResults'; // TODO backend-wire-up
const DefaultPollResults = (() => null) as React.ComponentType<any>; // temporary shim
// import { MAX_OPTIONS_DISPLAYED, MAX_POLL_OPTIONS } from '../constants'; // TODO backend-wire-up
const MAX_OPTIONS_DISPLAYED = 10;
const MAX_POLL_OPTIONS = 100;
// import {
//   useChannelStateContext,
//   useChatContext,
//   useMessageContext,
//   usePollContext,
//   useTranslationContext,
// } from '../../../context'; // TODO backend-wire-up
const useChannelStateContext = (_?: string) => ({ channelCapabilities: {} });
const useChatContext = (_?: string) => ({ client: {} });
const useMessageContext = (_?: string) => ({ message: { id: '' } });
const usePollContext = (_?: string) => ({ poll: { state: {} } });
const useTranslationContext = (_?: string) => ({ t: (s: string, _?: any) => s });
// import { useStateStore } from '../../../store'; // TODO backend-wire-up
const useStateStore = (_store: any, _selector: any) => ({
  allow_answers: false,
  allow_user_suggested_options: false,
  answers_count: 0,
  created_by_id: '',
  is_closed: false,
  options: [],
  ownAnswer: undefined,
});

// import type { PollAnswer, PollOption, PollState } from 'stream-chat'; // TODO backend-wire-up
import type { PollAnswer, PollOption, PollState } from 'chat-shim';

type ModalName =
  | 'suggest-option'
  | 'add-comment'
  | 'view-all-options'
  | 'view-comments'
  | 'view-results'
  | 'end-vote';

type PollStateSelectorReturnValue = {
  allow_answers: boolean | undefined;
  allow_user_suggested_options: boolean | undefined;
  answers_count: number;
  created_by_id: string;
  is_closed: boolean | undefined;
  options: PollOption[];
  ownAnswer: PollAnswer | undefined;
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  allow_answers: nextValue.allow_answers,
  allow_user_suggested_options: nextValue.allow_user_suggested_options,
  answers_count: nextValue.answers_count,
  created_by_id: nextValue.created_by_id,
  is_closed: nextValue.is_closed,
  options: nextValue.options,
  ownAnswer: nextValue.ownAnswer,
});

export type PollActionsProps = {
  AddCommentForm?: React.ComponentType<AddCommentFormProps>;
  EndPollDialog?: React.ComponentType<EndPollDialogProps>;
  PollAnswerList?: React.ComponentType<PollAnswerListProps>;
  PollOptionsFullList?: React.ComponentType<FullPollOptionsListingProps>;
  PollResults?: React.ComponentType<PollResultsProps>;
  SuggestPollOptionForm?: React.ComponentType<SuggestPollOptionFormProps>;
};

export const PollActions = ({
  AddCommentForm = DefaultAddCommentForm,
  EndPollDialog = DefaultEndPollDialog,
  PollAnswerList = DefaultPollAnswerList,
  PollOptionsFullList = DefaultPollOptionsFullList,
  PollResults = DefaultPollResults,
  SuggestPollOptionForm = DefaultSuggestPollOptionForm,
}: PollActionsProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext('PollActions');
  const { channelCapabilities = {} } = useChannelStateContext('PollActions');
  const { message } = useMessageContext('PollActions');
  const { poll } = usePollContext();
  const {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_by_id,
    is_closed,
    options,
    ownAnswer,
  } = useStateStore(poll.state, pollStateSelector);
  const [modalOpen, setModalOpen] = useState<ModalName | undefined>();

  const closeModal = useCallback(() => setModalOpen(undefined), []);
  const onUpdateAnswerClick = useCallback(() => setModalOpen('add-comment'), []);

  return (
    <div className='str-chat__poll-actions'>
      {options.length > MAX_OPTIONS_DISPLAYED && (
        <PollAction
          buttonText={t('See all options ({{count}})', {
            count: options.length,
          })}
          closeModal={closeModal}
          modalIsOpen={modalOpen === 'view-all-options'}
          openModal={() => setModalOpen('view-all-options')}
        >
          <PollOptionsFullList close={closeModal} />
        </PollAction>
      )}

      {!is_closed &&
        allow_user_suggested_options &&
        options.length < MAX_POLL_OPTIONS && (
          <PollAction
            buttonText={t('Suggest an option')}
            closeModal={closeModal}
            modalClassName='str-chat__suggest-poll-option-modal'
            modalIsOpen={modalOpen === 'suggest-option'}
            openModal={() => setModalOpen('suggest-option')}
          >
            <SuggestPollOptionForm close={closeModal} messageId={message.id} />
          </PollAction>
        )}

      {!is_closed && allow_answers && (
        <PollAction
          buttonText={ownAnswer ? t('Update your comment') : t('Add a comment')}
          closeModal={closeModal}
          modalClassName='str-chat__add-poll-answer-modal'
          modalIsOpen={modalOpen === 'add-comment'}
          openModal={() => setModalOpen('add-comment')}
        >
          <AddCommentForm close={closeModal} messageId={message.id} />
        </PollAction>
      )}

      {answers_count > 0 && channelCapabilities['query-poll-votes'] && (
        <PollAction
          buttonText={t('View {{count}} comments', { count: answers_count })}
          closeModal={closeModal}
          modalClassName='str-chat__poll-answer-list-modal'
          modalIsOpen={modalOpen === 'view-comments'}
          openModal={() => setModalOpen('view-comments')}
        >
          <PollAnswerList
            close={closeModal}
            onUpdateOwnAnswerClick={onUpdateAnswerClick}
          />
        </PollAction>
      )}

      <PollAction
        buttonText={t('View results')}
        closeModal={closeModal}
        modalClassName='str-chat__poll-results-modal'
        modalIsOpen={modalOpen === 'view-results'}
        openModal={() => setModalOpen('view-results')}
      >
        <PollResults close={closeModal} />
      </PollAction>

      {!is_closed && created_by_id === client.user?.id && (
        <PollAction
          buttonText={t('End vote')}
          closeModal={closeModal}
          modalClassName='str-chat__end-poll-modal'
          modalIsOpen={modalOpen === 'end-vote'}
          openModal={() => setModalOpen('end-vote')}
        >
          <EndPollDialog close={closeModal} />
        </PollAction>
      )}
    </div>
  );
};
