import { useEffect, useState } from 'react';
import { isVoteAnswer } from 'chat-shim';
import { useChatContext } from '../../../context';
import type { Event, PollAnswer, PollVote } from 'chat-shim';
import { on } from '../../../chatSDKShim';

import type { CursorPaginatorStateStore } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';

export function useManagePollVotesRealtime<T extends PollVote | PollAnswer = PollVote>(
  managedVoteType: 'answer' | 'vote',
  cursorPaginatorState?: CursorPaginatorStateStore<T>,
  optionId?: string,
) {
  const { client } = useChatContext();
  const [votesInRealtime, setVotesInRealtime] = useState<T[]>(
    cursorPaginatorState?.getLatestValue().items ?? [],
  );

  useEffect(
    () =>
      cursorPaginatorState?.subscribeWithSelector(
        (state) => [state.latestPageItems],
        ([latestPageItems]) =>
          setVotesInRealtime((prev) => [...prev, ...latestPageItems]),
      ),
    [cursorPaginatorState],
  );

  useEffect(() => {
    const handleVoteEvent = (event: Event) => {
      if (!event.poll_vote) return;
      const isAnswer = isVoteAnswer(event.poll_vote);
      if (
        (managedVoteType === 'answer' && !isAnswer) ||
        (managedVoteType === 'vote' &&
          (isAnswer || event.poll_vote.option_id !== optionId))
      )
        return;

      if (event.type === 'poll.vote_removed') {
        setVotesInRealtime((prev) =>
          event.poll_vote
            ? prev.filter((vote) => vote.id !== (event.poll_vote as T).id)
            : prev,
        );
      }
      if (event.type === 'poll.vote_changed') {
        setVotesInRealtime((prev) =>
          event.poll_vote
            ? prev.filter((vote) => vote.id !== (event.poll_vote as T).id)
            : prev,
        );
      }
      if (['poll.vote_casted', 'poll.vote_changed'].includes(event.type)) {
        setVotesInRealtime((prev) =>
          event.poll_vote ? [event.poll_vote as T, ...prev] : prev,
        );
      }
    };

    const voteCastedSubscription =
      on(client, 'poll.vote_casted', handleVoteEvent) ??
      ({ unsubscribe: () => undefined } as any);
    const voteRemovedSubscription =
      on(client, 'poll.vote_removed', handleVoteEvent) ??
      ({ unsubscribe: () => undefined } as any);
    const voteChangedSubscription =
      on(client, 'poll.vote_changed', handleVoteEvent) ??
      ({ unsubscribe: () => undefined } as any);

    return () => {
      voteCastedSubscription.unsubscribe();
      voteRemovedSubscription.unsubscribe();
      voteChangedSubscription.unsubscribe();
    };
  }, [client, optionId, managedVoteType]);

  return votesInRealtime;
}
