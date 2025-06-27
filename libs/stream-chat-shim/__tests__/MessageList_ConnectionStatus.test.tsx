import React from 'react';
import { render } from '@testing-library/react';
import { ConnectionStatus } from '../src/components/MessageList/ConnectionStatus';

test('renders without crashing', () => {
  render(<ConnectionStatus />);
});
