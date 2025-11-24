import React from 'react';
import clsx from 'clsx';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTypingContext } from '../../context/TypingContext';
import { useTranslationContext } from '../../context/TranslationContext';

export type TypingIndicatorProps = {
  /** Whether the typing indicator is in a thread */
  threadList?: boolean;
};

const useJoinTypingUsers = (names: string[]) => {
  const { t } = useTranslationContext();

  if (!names.length) return null;

  const [name, ...rest] = names;

  if (names.length === 1)
    return t('{{ user }} is typing...', {
      user: name,
    });

  const MAX_JOINED_USERS = 3;

  if (names.length > MAX_JOINED_USERS)
    return t('{{ users }} and more are typing...', {
      users: names.slice(0, MAX_JOINED_USERS).join(', ').trim(),
    });

  return t('{{ users }} and {{ user }} are typing...', {
    user: name,
    users: rest.join(', ').trim(),
  });
};

/**
 * TypingIndicator lists users currently typing, it needs to be a child of Channel component
 */
const UnMemoizedTypingIndicator = (props: TypingIndicatorProps) => {
  const { threadList } = props;

  const { channelConfig, thread, typingUsers: typingUsersFromChannel } =
    useChannelStateContext('TypingIndicator');
  const { client } = useChatContext('TypingIndicator');
  const { typing = {}, typingUsers: typingUsersFromContext } =
    useTypingContext('TypingIndicator');

  const typingEntries: { id: string; name?: string; parent_id?: string }[] = (
    typingUsersFromChannel?.length
      ? typingUsersFromChannel
      : typingUsersFromContext?.length
        ? typingUsersFromContext
      : Object.values(typing || {}).map(({ parent_id, user }) => ({
          id: user?.id ?? '',
          name: user?.name,
          parent_id,
        }))
  ).filter((entry) => entry.id && entry.id !== client.user?.id);

  const filteredEntries = (threadList
    ? typingEntries.filter(({ parent_id }) => parent_id && parent_id === thread?.id)
    : typingEntries.filter(({ parent_id }) => !parent_id)) as Array<{
    id: string;
    name?: string;
    parent_id?: string;
  }>;

  const typingUserList = Array.from(
    new Set(
      filteredEntries
        .map(({ id, name }) => {
          if (id.startsWith('ai-bot-')) return 'Agent';
          return name || id;
        })
        .filter(Boolean) as string[],
    ),
  );

  const joinedTypingUsers = useJoinTypingUsers(typingUserList);

  const isTypingActive = filteredEntries.length > 0;

  if (channelConfig?.typing_events === false) {
    return null;
  }

  if (!isTypingActive) return null;
  return (
    <div
      className={clsx('str-chat__typing-indicator', {
        'str-chat__typing-indicator--typing': isTypingActive,
      })}
      data-testid='typing-indicator'
    >
      <div className='str-chat__typing-indicator__dots'>
        <span className='str-chat__typing-indicator__dot'></span>
        <span className='str-chat__typing-indicator__dot'></span>
        <span className='str-chat__typing-indicator__dot'></span>
      </div>
      <div className='str-chat__typing-indicator__users' data-testid='typing-users'>
        {joinedTypingUsers}
      </div>
    </div>
  );
};

export const TypingIndicator = React.memo(
  UnMemoizedTypingIndicator,
) as typeof UnMemoizedTypingIndicator;
