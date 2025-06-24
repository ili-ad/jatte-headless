import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListLoadingIndicator } from '../src/ThreadListLoadingIndicator';

test('renders placeholder', () => {
  const { getByTestId } = render(<ThreadListLoadingIndicator />);
  expect(getByTestId('thread-list-loading-indicator-placeholder')).toBeTruthy();
});
