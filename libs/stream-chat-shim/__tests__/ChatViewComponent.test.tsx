import React from 'react';
import { render } from '@testing-library/react';
import { ChatView } from '../src/components/ChatView/ChatView';

test('renders without crashing', () => {
  render(<ChatView />);
});
