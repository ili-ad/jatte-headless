import React from 'react';
import { render } from '@testing-library/react';
import { MessageStatus } from '../src/components/Message/MessageStatus';

test('renders without crashing', () => {
  render(<MessageStatus />);
});
