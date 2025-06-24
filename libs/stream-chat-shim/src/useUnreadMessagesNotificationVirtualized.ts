import { useCallback, useEffect, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

export type RenderedMessage = LocalMessage | { created_at?: Date | string | null };

export type UseUnreadMessagesNotificationParams = {
  showAlways: boolean;
  unreadCount: number;
  lastRead?: Date | null;
};

/**
 * Controls the logic when an `UnreadMessagesNotification` component should be shown.
 * This shim mirrors the upstream hook's behaviour.
 */
export const useUnreadMessagesNotificationVirtualized = ({
  lastRead,
  showAlways,
  unreadCount,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);

  const toggleShowUnreadMessagesNotification = useCallback(
    (renderedMessages: RenderedMessage[]) => {
      if (!unreadCount) return;
      const firstRenderedMessage = renderedMessages[0];
      const lastRenderedMessage = renderedMessages.slice(-1)[0];
      if (!(firstRenderedMessage && lastRenderedMessage)) return;

      const firstRenderedMessageTime = new Date(
        (firstRenderedMessage as LocalMessage).created_at ?? 0,
      ).getTime();
      const lastRenderedMessageTime = new Date(
        (lastRenderedMessage as LocalMessage).created_at ?? 0,
      ).getTime();
      const lastReadTime = new Date(lastRead ?? 0).getTime();

      const scrolledBelowSeparator =
        !!lastReadTime && firstRenderedMessageTime > lastReadTime;
      const scrolledAboveSeparator =
        !!lastReadTime && lastRenderedMessageTime < lastReadTime;

      setShow(
        showAlways
          ? scrolledBelowSeparator || scrolledAboveSeparator
          : scrolledBelowSeparator,
      );
    },
    [lastRead, showAlways, unreadCount],
  );

  useEffect(() => {
    if (!unreadCount) setShow(false);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification } as const;
};
