import React from 'react';
import type { UserResponse } from 'stream-chat';

export type ReactEventHandler = (
  event: React.BaseSyntheticEvent,
) => Promise<void> | void;

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export type MuteUserNotifications<StreamChatGenerics = unknown> = {
  getErrorNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  getSuccessNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

/**
 * Placeholder implementation of Stream's `useMuteHandler` hook.
 */
export const useMuteHandler = <StreamChatGenerics = unknown>(
  _message?: unknown,
  _notifications: MuteUserNotifications<StreamChatGenerics> = {},
): ReactEventHandler => {
  return async () => {
    throw new Error('useMuteHandler not implemented');
  };
};
