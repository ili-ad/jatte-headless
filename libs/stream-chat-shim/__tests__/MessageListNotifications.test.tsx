import React from 'react';
import { render } from '@testing-library/react';
import { MessageListNotifications } from '../src/components/MessageList/MessageListNotifications';
import { MessageNotification } from '../src/components/MessageList/MessageNotification';

describe('MessageListNotifications', () => {
  test('renders without crashing', () => {
    render(
      <MessageListNotifications
        hasNewMessages={false}
        isMessageListScrolledToBottom={true}
        isNotAtLatestMessageSet={false}
        MessageNotification={MessageNotification}
        notifications={[]}
        scrollToBottom={() => {}}
      />
    );
  });
});
