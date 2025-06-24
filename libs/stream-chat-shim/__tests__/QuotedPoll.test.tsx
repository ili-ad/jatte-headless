import React from 'react';
import { render } from '@testing-library/react';
import { QuotedPoll } from '../src/QuotedPoll';

test('renders placeholder', () => {
  const { getByTestId } = render(<QuotedPoll />);
  expect(getByTestId('quoted-poll-placeholder')).toBeTruthy();
});
