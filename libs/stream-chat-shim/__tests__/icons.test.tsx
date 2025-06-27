
import React from 'react';
import { render } from '@testing-library/react';
import { ChatBubble } from '../src/components/EmptyStateIndicator/icons';

test('renders chat bubble icon', () => {
  const { getByTestId } = render(<ChatBubble />);
  expect(getByTestId('chat-bubble')).toB
  render(<MenuIcon />);
  render(<ReturnIcon />);
  render(<XIcon />);
  render(<SearchIcon className='' />);

});
