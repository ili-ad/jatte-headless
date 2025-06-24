import React from 'react';
import { render } from '@testing-library/react';
import { ConnectionStatus } from '../src/ConnectionStatus';

test('renders placeholder', () => {
  const { getByTestId } = render(<ConnectionStatus />);
  expect(getByTestId('connection-status-placeholder')).toBeTruthy();
});

