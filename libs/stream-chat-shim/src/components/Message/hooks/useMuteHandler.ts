import { isUserMuted, validateAndGetMessage } from '../utils';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage, Mute, UserResponse } from 'chat-shim';

import type { ReactEventHandler } from '../types';

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export type MuteUserNotifications = {
  getErrorNotification?: (user: UserResponse) => string;
  getSuccessNotification?: (user: UserResponse) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMuteHandler = (
  message?: LocalMessage,
  notifications: MuteUserNotifications = {},
): ReactEventHandler => {
  const { channel, mutes } = useChannelStateContext('useMuteHandler');
  const { client } = useChatContext('useMuteHandler');
  const { t } = useTranslationContext('useMuteHandler');

  const removeMuteLocally = (targetUserId: number) => {
    if (!client) return;

    const filterMuteList = (value: unknown): Mute[] => {
      if (!Array.isArray(value)) return [];
      return value.filter((mute) => {
        const item = mute as Record<string, unknown>;
        const directId =
          typeof item.user_id === 'number'
            ? item.user_id
            : typeof item.user_id === 'string'
              ? Number.parseInt(item.user_id, 10)
              : null;
        if (typeof directId === 'number' && !Number.isNaN(directId)) {
          return directId !== targetUserId;
        }

        const target = item.target as Record<string, unknown> | undefined;
        const targetId =
          typeof target?.id === 'number'
            ? target.id
            : typeof target?.id === 'string'
              ? Number.parseInt(target.id, 10)
              : null;
        if (typeof targetId === 'number' && !Number.isNaN(targetId)) {
          return targetId !== targetUserId;
        }

        const genericId =
          typeof item.id === 'number'
            ? item.id
            : typeof item.id === 'string'
              ? Number.parseInt(item.id, 10)
              : null;
        if (typeof genericId === 'number' && !Number.isNaN(genericId)) {
          return genericId !== targetUserId;
        }

        return true;
      }) as Mute[];
    };

    const assignFilteredMutes = (userLike: unknown): Mute[] | undefined => {
      if (!userLike || typeof userLike !== 'object') return undefined;
      const nextMutes = filterMuteList((userLike as Record<string, unknown>).mutes);
      (userLike as Record<string, unknown>).mutes = nextMutes;
      return nextMutes;
    };

    const nextUserMutes =
      assignFilteredMutes((client as Record<string, unknown>).user) ??
      assignFilteredMutes((client as Record<string, unknown>)._user) ??
      filterMuteList(undefined);

    if (Array.isArray((client as Record<string, unknown>).mutedUsers)) {
      (client as Record<string, unknown>).mutedUsers = (
        (client as Record<string, unknown>).mutedUsers as Array<Record<string, unknown>>
      ).filter((mute) => {
        const muteId =
          typeof mute.id === 'number'
            ? mute.id
            : typeof mute.id === 'string'
              ? Number.parseInt(mute.id, 10)
              : null;
        if (typeof muteId === 'number' && !Number.isNaN(muteId)) {
          return muteId !== targetUserId;
        }
        return true;
      });
    }

    const eventPayload = { me: { mutes: nextUserMutes } };
    if (typeof (client as { dispatchEvent?: (event: Record<string, unknown>) => void }).dispatchEvent === 'function') {
      client.dispatchEvent({
        type: 'notification.mutes_updated',
        ...eventPayload,
      });
    } else if (typeof (client as { emit?: (event: string, data: unknown) => void }).emit === 'function') {
      client.emit('notification.mutes_updated', eventPayload);
    }
  };

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    if (!t || !message?.user || !notify || !client) {
      console.warn(missingUseMuteHandlerParamsWarning);
      return;
    }

    const cid = channel?.cid ?? (message.cid as string | undefined);
    if (!cid) {
      console.warn('muteUser requires an active channel cid');
      return;
    }

    if (!isUserMuted(message, mutes)) {
      try {
        await client.muteUser(message.user.id, { cid });

        const successMessage =
          getSuccessNotification &&
          validateAndGetMessage(getSuccessNotification, [message.user]);

        notify(
          successMessage ||
            t(`{{ user }} has been muted`, {
              user: message.user.name || message.user.id,
            }),
          'success',
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message.user]);

        notify(errorMessage || t('Error muting a user ...'), 'error');
      }
    } else {
      try {
        const rawUserId = message.user.id;
        const numericUserId =
          typeof rawUserId === 'number'
            ? rawUserId
            : Number.parseInt(String(rawUserId), 10);

        if (!Number.isInteger(numericUserId)) {
          throw new Error('unmuteUser requires a numeric user id');
        }

        await client.unmuteUser(rawUserId);
        removeMuteLocally(numericUserId);

        const fallbackMessage = t(`{{ user }} has been unmuted`, {
          user: message.user.name || message.user.id,
        });

        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          fallbackMessage;

        if (typeof successMessage === 'string') {
          notify(successMessage, 'success');
        }
      } catch (e) {
        const errorMessage =
          (getErrorNotification &&
            validateAndGetMessage(getErrorNotification, [message.user])) ||
          t('Error unmuting a user ...');

        if (typeof errorMessage === 'string') {
          notify(errorMessage, 'error');
        }
      }
    }
  };
};
