import { useCallback } from 'react';
import type { PollOptionVotesQueryParams, PollVote } from 'chat-shim';

export type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export type UsePollOptionVotesPaginationResult = {
  error?: Error;
  hasNextPage: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  votes: PollVote[];
};

/**
 * Placeholder implementation for Stream's `usePollOptionVotesPagination` hook.
 * Returns static state and a loadMore function that throws until implemented.
 */
export const usePollOptionVotesPagination = (
  _params: UsePollOptionVotesPaginationParams,
): UsePollOptionVotesPaginationResult => {
  const loadMore = useCallback(async () => {
    throw new Error('usePollOptionVotesPagination not implemented');
  }, []);

  return {
    error: undefined,
    hasNextPage: false,
    loading: false,
    loadMore,
    votes: [],
  };
};
