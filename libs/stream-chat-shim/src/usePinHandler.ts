import { useCallback } from 'react';

/**
 * @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
 */
export type PinEnabledUserRoles<T extends string = string> = Partial<Record<T, boolean>> & {
  admin?: boolean;
  anonymous?: boolean;
  channel_member?: boolean;
  channel_moderator?: boolean;
  guest?: boolean;
  member?: boolean;
  moderator?: boolean;
  owner?: boolean;
  user?: boolean;
};

/**
 * @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
 */
export type PinPermissions<T extends string = string, U extends string = string> =
  Partial<Record<T, PinEnabledUserRoles<U>>> & {
    commerce?: PinEnabledUserRoles<U>;
    gaming?: PinEnabledUserRoles<U>;
    livestream?: PinEnabledUserRoles<U>;
    messaging?: PinEnabledUserRoles<U>;
    team?: PinEnabledUserRoles<U>;
  };

export type PinMessageNotifications<StreamChatGenerics extends unknown = unknown> = {
  getErrorNotification?: (message: any) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

/**
 * Placeholder implementation of Stream's `usePinHandler` hook.
 * Returns a handler that throws to indicate unimplemented behaviour.
 */
export const usePinHandler = <StreamChatGenerics extends unknown = unknown>(
  _message: any,
  _permissions: PinPermissions = {},
  _notifications: PinMessageNotifications<StreamChatGenerics> = {},
) => {
  const handlePin = useCallback(() => {
    throw new Error('usePinHandler not implemented');
  }, []);

  const canPin = false;

  return { canPin, handlePin } as const;
};
