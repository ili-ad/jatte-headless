import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ChannelActionProvider } from '../src/⛔_legacy_ui/ChannelActionContext';
import { UnreadMessagesNotification } from '../src/components/MessageList/UnreadMessagesNotification';

describe('UnreadMessagesNotification', () => {
  it('calls actions when buttons clicked', () => {
    const jumpToFirstUnreadMessage = jest.fn();
    const markRead = jest.fn();
    const { getByText, getByTestId } = render(
      <ChannelActionProvider jumpToFirstUnreadMessage={jumpToFirstUnreadMessage} markRead={markRead}>
        <UnreadMessagesNotification showCount unreadCount={3} />
      </ChannelActionProvider>
    );

    fireEvent.click(getByText('3 unread'));
    expect(jumpToFirstUnreadMessage).toHaveBeenCalled();

    fireEvent.click(getByTestId('unread-messages-notification').querySelector('button:last-child')!);
    expect(markRead).toHaveBeenCalled();
  });
});
