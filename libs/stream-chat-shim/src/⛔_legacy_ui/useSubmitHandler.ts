import type React from 'react';
import type { MessageInputProps } from './MessageInput';

/**
 * Placeholder implementation of Stream's `useSubmitHandler` hook.
 * Returns a handler that currently throws to indicate missing behaviour.
 */
export const useSubmitHandler = (_props: MessageInputProps) => {
  const handleSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault?.();
    throw new Error('useSubmitHandler not implemented');
  };

  return { handleSubmit } as const;
};
