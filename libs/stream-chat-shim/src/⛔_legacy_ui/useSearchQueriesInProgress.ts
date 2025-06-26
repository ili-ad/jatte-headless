import { useCallback, useState } from 'react';

/**
 * Minimal placeholder implementation of Stream's `useSearchQueriesInProgress` hook.
 * Tracks the number of active search queries and exposes helpers to update it.
 */
export const useSearchQueriesInProgress = () => {
  const [queriesInProgress, setQueriesInProgress] = useState(0);

  const startQuery = useCallback(() => {
    setQueriesInProgress((count) => count + 1);
  }, []);

  const endQuery = useCallback(() => {
    setQueriesInProgress((count) => Math.max(0, count - 1));
  }, []);

  return { queriesInProgress, startQuery, endQuery } as const;
};

export default useSearchQueriesInProgress;
