import React from 'react';
import { render } from '@testing-library/react';
import { MessageListMainPanel } from '../src/components/MessageList/MessageListMainPanel';

test('renders without crashing', () => {
  render(<MessageListMainPanel />);
});
