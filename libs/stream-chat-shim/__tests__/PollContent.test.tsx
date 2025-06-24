import React from 'react';
import { render } from '@testing-library/react';
import { PollContent } from '../src/PollContent';

test('renders placeholder', () => {
  const { getByTestId } = render(<PollContent />);
  expect(getByTestId('poll-content-placeholder')).toBeTruthy();
});
