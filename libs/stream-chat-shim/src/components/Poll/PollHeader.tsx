import React, { useMemo } from 'react';
import { usePollContext, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { PollOption, PollState } from 'chat-shim';

type PollStateSelectorReturnValue = {
  enforce_unique_vote: boolean;
  is_closed: boolean | undefined;
  max_votes_allowed: number;
  name: string;
  options: PollOption[];
};
const pollStateSelector = (nextValue: PollState): PollStateSelectorReturnValue => ({
  enforce_unique_vote: nextValue.enforce_unique_vote,
  is_closed: nextValue.is_closed,
  max_votes_allowed: nextValue.max_votes_allowed,
  name: nextValue.name,
  options: nextValue.options,
});

export const PollHeader = () => {
  const { t } = useTranslationContext('PollHeader');

  const { poll } = usePollContext();
  const { enforce_unique_vote, is_closed, max_votes_allowed, name, options } =
    useStateStore(poll.state, pollStateSelector);

  const selectionInstructions = useMemo(() => {
    if (is_closed) return t('Vote ended');
    if (enforce_unique_vote || options.length === 1) return t('Select one');
    if (max_votes_allowed)
      return t('Select up to {{count}}', {
        count: max_votes_allowed > options.length ? options.length : max_votes_allowed,
      });
    if (options.length > 1) return t('Select one or more');
    return '';
  }, [is_closed, enforce_unique_vote, max_votes_allowed, options.length, t]);

  if (!name) return;

  return (
    <div className='str-chat__poll-header'>
      <div className='str-chat__poll-title'>{name}</div>
      <div className='str-chat__poll-subtitle'>{selectionInstructions}</div>
    </div>
  );
};
