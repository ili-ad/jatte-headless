import React from 'react';
import { render } from '@testing-library/react';
import { QuotedMessage } from '../src/QuotedMessage';

test('renders placeholder', () => {
  const { getByTestId } = render(<QuotedMessage />);
  expect(getByTestId('quoted-message-placeholder')).toBeTruthy();
});
