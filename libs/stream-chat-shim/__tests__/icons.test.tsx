import React from 'react';
import { render } from '@testing-library/react';
import { ChatBubble } from '../src/components/EmptyStateIndicator/icons';

test('renders chat bubble icon', () => {
  const { getByTestId } = render(<ChatBubble />);
  expect(getByTestId('chat-bubble')).toBeTruthy();
});
