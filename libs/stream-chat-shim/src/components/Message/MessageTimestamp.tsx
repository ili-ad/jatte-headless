import React from 'react';
import { useMessageContext } from '../../context/MessageContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { useComponentContext } from '../../context';

import type { LocalMessage } from 'chat-shim';
import type { TimestampFormatterOptions } from '../../i18n/types';

const toValidDate = (input?: Date | string | number | null) => {
  if (!input) return undefined;

  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export type MessageTimestampProps = TimestampFormatterOptions & {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value from `MessageContext`) */
  message?: LocalMessage;
};

const UnMemoizedMessageTimestamp = (props: MessageTimestampProps) => {
  const { message: propMessage, ...timestampProps } = props;
  const { message: contextMessage } = useMessageContext('MessageTimestamp');
  const { Timestamp = DefaultTimestamp } = useComponentContext('MessageTimestamp');
  const message = propMessage || contextMessage;
  const createdAt = toValidDate(message?.created_at);

  if (!message || !createdAt) return null;

  return <Timestamp timestamp={createdAt} {...timestampProps} />;
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
