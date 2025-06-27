import clsx from 'clsx';
import React from 'react';
import type { PollState } from 'stream-chat';
const usePollContext = () => ({ poll: { state: {} as PollState } } as any);
const useStateStore = (_store: any, _selector: any) => ({
  is_closed: false,
  name: '',
});
import type { PollState } from 'chat-shim';

type PollStateSelectorQuotedPollReturnValue = {
  is_closed: boolean | undefined;
  name: string;
};
const pollStateSelectorQuotedPoll = (
  nextValue: PollState,
): PollStateSelectorQuotedPollReturnValue => ({
  is_closed: nextValue.is_closed,
  name: nextValue.name,
});

export const QuotedPoll = () => {
  const { poll } = usePollContext();
  const { is_closed, name } = useStateStore(
    poll.state,
    pollStateSelectorQuotedPoll,
  );

  return (
    <div
      className={clsx('str-chat__quoted-poll-preview', {
        'str-chat__quoted-poll-preview--closed': is_closed,
      })}
    >
      <div className='str-chat__quoted-poll-preview__icon'>📊</div>
      <div className='str-chat__quoted-poll-preview__name'>{name}</div>
    </div>
  );
};

export default QuotedPoll;
