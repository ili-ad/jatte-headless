import { useCallback } from 'react';
import { useManagePollVotesRealtime } from './useManagePollVotesRealtime';
import type {
  CursorPaginatorState,
  PaginationFn,
} from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { useCursorPaginator } from '../../InfiniteScrollPaginator/hooks/useCursorPaginator';
import { usePollContext } from '../../../context';
import { queryAnswers } from '../../../chatSDKShim';

import { useStateStore } from '../../../store';
import type { PollAnswer, PollAnswersQueryParams, PollVote } from 'chat-shim';

const paginationStateSelector = (
  state: CursorPaginatorState<PollVote>,
): [Error | undefined, boolean, boolean] => [
  state.error,
  state.hasNextPage,
  state.loading,
];

type UsePollAnswerPaginationParams = {
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswerPagination = ({
  paginationParams,
}: UsePollAnswerPaginationParams = {}) => {
  const { poll } = usePollContext();

  const paginationFn = useCallback<PaginationFn<PollAnswer>>(
    async (next) => {
      const { next: newNext, votes } = await queryAnswers(poll, {
        ...(paginationParams ?? {}),
        next,
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { cursorPaginatorState, loadMore } = useCursorPaginator(paginationFn, true);
  const answers = useManagePollVotesRealtime<PollAnswer>('answer', cursorPaginatorState);
  const [error, hasNextPage, loading] = useStateStore(
    cursorPaginatorState,
    paginationStateSelector,
  );

  return {
    answers,
    error,
    hasNextPage,
    loading,
    loadMore,
  };
};
