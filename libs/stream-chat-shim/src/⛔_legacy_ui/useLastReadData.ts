import { useMemo } from 'react';
import type { LocalMessage, UserResponse } from 'chat-shim';

const CUSTOM_MESSAGE_TYPE = {
  date: 'message.date',
  intro: 'channel.intro',
} as const;

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro;
  id?: string;
};

type DateSeparatorMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.date;
  date: Date;
  id?: string;
  type?: string;
  unread?: boolean;
};

export type RenderedMessage = LocalMessage | DateSeparatorMessage | IntroMessage;

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function isIntroMessage(message: unknown): message is IntroMessage {
  return (message as IntroMessage)?.customType === CUSTOM_MESSAGE_TYPE.intro;
}

export function isDateSeparatorMessage(
  message: unknown,
): message is DateSeparatorMessage {
  return (
    message !== null &&
    typeof message === 'object' &&
    (message as DateSeparatorMessage).customType === CUSTOM_MESSAGE_TYPE.date &&
    isDate((message as DateSeparatorMessage).date)
  );
}

export function isLocalMessage(message: unknown): message is LocalMessage {
  return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}

export const getReadStates = (
  messages: LocalMessage[],
  read: Record<string, { last_read: Date; user: UserResponse }> = {},
  returnAllReadData: boolean,
) => {
  const readData: Record<string, Array<UserResponse>> = {};

  Object.values(read).forEach((readState) => {
    if (!readState.last_read) return;

    let userLastReadMsgId: string | undefined;

    messages.forEach((msg) => {
      if (msg.created_at && msg.created_at < readState.last_read) {
        userLastReadMsgId = msg.id;
        if (returnAllReadData) {
          if (!readData[userLastReadMsgId]) {
            readData[userLastReadMsgId] = [];
          }
          readData[userLastReadMsgId].push(readState.user);
        }
      }
    });

    if (userLastReadMsgId && !returnAllReadData) {
      if (!readData[userLastReadMsgId]) {
        readData[userLastReadMsgId] = [];
      }
      readData[userLastReadMsgId].push(readState.user);
    }
  });

  return readData;
};

type UseLastReadDataParams = {
  messages: RenderedMessage[];
  returnAllReadData: boolean;
  userID: string | undefined;
  read?: Record<string, { last_read: Date; user: UserResponse }>;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
  const { messages, read, returnAllReadData, userID } = props;

  return useMemo(() => {
    const ownLocalMessages = messages.filter(
      (msg) => isLocalMessage(msg) && (msg as any).user?.id === userID,
    ) as LocalMessage[];
    return getReadStates(ownLocalMessages, read, returnAllReadData);
  }, [messages, read, returnAllReadData, userID]);
};
