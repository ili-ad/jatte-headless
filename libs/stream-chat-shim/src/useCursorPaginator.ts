import { useCallback, useEffect, useState } from 'react';

export type CursorPaginatorState<T> = {
  hasNextPage: boolean;
  items: T[];
  latestPageItems: T[];
  loading: boolean;
  error?: Error;
  next?: string | null;
};

export type CursorPaginatorStateStore<T> = {
  getLatestValue: () => CursorPaginatorState<T>;
};

export type PaginationFn<T> = (next?: string) => Promise<{ items: T[]; next?: string }>;

/**
 * Placeholder implementation of Stream's `useCursorPaginator` hook.
 * Maintains minimal state structure and throws when attempting to load data.
 */
export const useCursorPaginator = <T>(
  _paginationFn: PaginationFn<T>,
  loadFirstPage?: boolean,
) => {
  const [state] = useState<CursorPaginatorState<T>>({
    hasNextPage: true,
    items: [],
    latestPageItems: [],
    loading: false,
  });

  const getLatestValue = useCallback(() => state, [state]);

  const cursorPaginatorState: CursorPaginatorStateStore<T> = {
    getLatestValue,
  };

  const loadMore = useCallback(async () => {
    throw new Error('useCursorPaginator not implemented');
  }, []);

  useEffect(() => {
    // intentionally empty: placeholder does not automatically load pages
  }, [loadFirstPage]);

  return {
    cursorPaginatorState,
    loadMore,
  };
};
