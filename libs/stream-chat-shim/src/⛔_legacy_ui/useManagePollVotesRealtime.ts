import { useEffect, useState } from 'react';
import type { PollAnswer, PollVote } from 'chat-shim';
import type { CursorPaginatorStateStore } from './useCursorPaginator';

/**
 * Placeholder for Stream\'s `useManagePollVotesRealtime` hook.
 *
 * Maintains a list of votes, but does not subscribe to real-time events yet.
 */
export function useManagePollVotesRealtime<T extends PollVote | PollAnswer = PollVote>(
  _managedVoteType: 'answer' | 'vote',
  cursorPaginatorState?: CursorPaginatorStateStore<T>,
  _optionId?: string,
) {
  const [votesInRealtime, setVotesInRealtime] = useState<T[]>(
    cursorPaginatorState?.getLatestValue().items ?? [],
  );

  useEffect(() => {
    // TODO: connect to Stream Chat client and handle vote events
    setVotesInRealtime(cursorPaginatorState?.getLatestValue().items ?? []);
  }, [cursorPaginatorState]);

  return votesInRealtime;
}
