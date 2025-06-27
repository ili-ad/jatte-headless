import { useState } from 'react';
import type { PollAnswer, PollAnswersQueryParams } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `usePollAnswerPagination` hook.
 * Maintains the same public API shape without connecting to Stream Chat.
 */
export type UsePollAnswerPaginationParams = {
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswerPagination = (
  _params: UsePollAnswerPaginationParams = {}
) => {
  const [answers] = useState<Array<PollAnswer>>([]);
  const [error] = useState<Error | undefined>();
  const [hasNextPage] = useState(true);
  const [loading] = useState(false);

  const loadMore = () => {
    throw new Error('usePollAnswerPagination not implemented');
  };

  return { answers, error, hasNextPage, loading, loadMore } as const;
};
