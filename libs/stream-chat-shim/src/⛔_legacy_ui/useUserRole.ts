import type { LocalMessage } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `useUserRole` hook.
 *
 * Returns a structure describing what actions the current user is
 * allowed to perform on the given message. This shim does not yet
 * integrate with the Stream Chat context or channel capabilities and
 * therefore defaults most permissions to `false`.
 *
 * @param message - The message to evaluate permissions for.
 * @param onlySenderCanEdit - Whether only the sender can edit their message.
 * @param disableQuotedMessages - If quoting messages is disabled.
 */
export const useUserRole = (
  message: LocalMessage,
  _onlySenderCanEdit?: boolean,
  _disableQuotedMessages?: boolean,
) => {
  const client: any = (message as any).client;
  const isMyMessage = client?.userID === message.user?.id;

  return {
    canDelete: false,
    canEdit: false,
    canFlag: false,
    canMarkUnread: false,
    canMute: false,
    canQuote: false,
    canReact: false,
    canReply: false,
    isAdmin: false,
    isModerator: false,
    isMyMessage,
    isOwner: false,
  } as const;
};
