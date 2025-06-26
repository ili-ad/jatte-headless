/** Channel utility helpers used across the UI.
 * This is a lightweight shim that mirrors the
 * `stream-chat-react` exports.
 */

// simple nanoid substitute – avoids extra deps
const nanoid = () => Math.random().toString(36).slice(2);

import type { Dispatch, SetStateAction } from 'react';
import type { ChannelState, MessageResponse, StreamChat } from 'stream-chat';

export type ChannelNotifications = { id: string; text: string; type: 'success' | 'error' }[];

export const makeAddNotifications =
  (
    setNotifications: Dispatch<SetStateAction<ChannelNotifications>>,
    notificationTimeouts: NodeJS.Timeout[],
  ) =>
  (text: string, type: 'success' | 'error') => {
    if (typeof text !== 'string' || (type !== 'success' && type !== 'error')) {
      return;
    }

    const id = nanoid();

    setNotifications((prevNotifications) => [
      ...prevNotifications,
      { id, text, type },
    ]);

    const timeout = setTimeout(
      () =>
        setNotifications((prevNotifications) =>
          prevNotifications.filter((n) => n.id !== id),
        ),
      5000,
    );

    notificationTimeouts.push(timeout);
  };

/** Find a message by id within a formatted message set. */
export const findInMsgSetById = (
  targetId: string,
  msgSet: ReturnType<ChannelState['formatMessage']>[],
) => {
  for (let i = msgSet.length - 1; i >= 0; i--) {
    const item = msgSet[i];
    if ((item as any).id === targetId) {
      return { index: i, target: item };
    }
  }
  return { index: -1 as const };
};

/** Binary search a message set for a timestamp. */
export const findInMsgSetByDate = (
  targetDate: Date,
  msgSet: MessageResponse[] | ReturnType<ChannelState['formatMessage']>[],
  exact = false,
) => {
  const targetTimestamp = targetDate.getTime();
  let left = 0;
  let middle = 0;
  let right = msgSet.length - 1;
  while (left <= right) {
    middle = Math.floor((right + left) / 2);
    const middleTimestamp = new Date(
      (msgSet[middle] as any).created_at as string | Date,
    ).getTime();
    const middleLeftTimestamp =
      msgSet[middle - 1]?.created_at &&
      new Date((msgSet[middle - 1] as any).created_at as string | Date).getTime();
    const middleRightTimestamp =
      msgSet[middle + 1]?.created_at &&
      new Date((msgSet[middle + 1] as any).created_at as string | Date).getTime();
    if (
      middleTimestamp === targetTimestamp ||
      (middleLeftTimestamp &&
        middleRightTimestamp &&
        middleLeftTimestamp < targetTimestamp &&
        targetTimestamp < middleRightTimestamp)
    ) {
      return { index: middle, target: msgSet[middle] };
    }
    if (middleTimestamp < targetTimestamp) left = middle + 1;
    else right = middle - 1;
  }

  if (
    !exact ||
    new Date((msgSet[left] as any).created_at as string | Date).getTime() === targetTimestamp
  ) {
    return { index: left, target: msgSet[left] };
  }
  return { index: -1 };
};

export const generateMessageId = ({ client }: { client: StreamChat }) =>
  `${client.userID}-${nanoid()}`;
