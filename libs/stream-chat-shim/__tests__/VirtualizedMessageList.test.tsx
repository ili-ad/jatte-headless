import React from 'react';
import { render } from '@testing-library/react';
import { VirtualizedMessageList } from '../src/components/MessageList/VirtualizedMessageList';

test('renders placeholder', () => {
  const { getByTestId } = render(<VirtualizedMessageList />);
  expect(getByTestId('virtualized-message-list')).toBeTruthy();
});
