import { useMemo } from 'react';

import type { TypingContextValue } from '../../../context/TypingContext';

export const useCreateTypingContext = (value: TypingContextValue) => {
  const { typing, typingUsers } = value;

  const typingValue = Object.keys(typing || {}).join();
  const typingUsersKey = (typingUsers || [])
    .map(({ id, parent_id }) => `${id}:${parent_id ?? ''}`)
    .join();

  const typingContext: TypingContextValue = useMemo(
    () => ({
      typing,
      typingUsers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typingUsersKey, typingValue, typing],
  );

  return typingContext;
};
