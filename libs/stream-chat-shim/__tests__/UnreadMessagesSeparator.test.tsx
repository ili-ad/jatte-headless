import React from 'react';
import { render } from '@testing-library/react';
import { UnreadMessagesSeparator } from '../src/components/MessageList/UnreadMessagesSeparator';

test('renders unread messages separator', () => {
  render(<UnreadMessagesSeparator unreadCount={1} />);
});
