import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import type {
  CursorPaginatorState,
  PaginationFn,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useCursorPaginator } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useStateStore } from '../../../store';
import { usePollContext } from '../../../context';
import { queryOptionVotes } from '../../../chatSDKShim';

import type { PollOptionVotesQueryParams, PollVote } from 'chat-shim';

const paginationStateSelector = (
  state: CursorPaginatorState<PollVote>,
): [Error | undefined, boolean, boolean] => [
  state.error,
  state.hasNextPage,
  state.loading,
];

type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = ({
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const { poll } = usePollContext();

  const paginationFn = useCallback<PaginationFn<PollVote>>(
    async (next) => {
      const { next: newNext, votes } = await queryOptionVotes(poll, {
        filter: paginationParams.filter,
        options: !next
          ? paginationParams?.options
          : { ...(paginationParams?.options ?? {}), next },
        sort: { created_at: -1, ...(paginationParams?.sort ?? {}) },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const votes = useManagePollVotesRealtime<PollVote>(
    'vote',
    cursorPaginatorState,
    paginationParams.filter.option_id,
  );
  const [error, hasNextPage, loading] = useStateStore(
    cursorPaginatorState,
    paginationStateSelector,
  );

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    votes,
  };
};
