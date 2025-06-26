import React from 'react';
import { render } from '@testing-library/react';
import { MessageInput } from '../src/components/MessageInput/MessageInput';

test('renders without crashing', () => {
  render(<MessageInput />);
});
