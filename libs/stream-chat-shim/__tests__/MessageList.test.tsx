import React from 'react';
import { render } from '@testing-library/react';
import { MessageList } from '../src/MessageList';

test('renders placeholder', () => {
  const { getByTestId } = render(<MessageList />);
  expect(getByTestId('message-list-placeholder')).toBeTruthy();
});
