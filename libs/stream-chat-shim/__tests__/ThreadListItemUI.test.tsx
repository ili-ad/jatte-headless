import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListItemUI } from '../src/ThreadListItemUI';

test('renders placeholder', () => {
  const { getByTestId } = render(<ThreadListItemUI />);
  expect(getByTestId('thread-list-item-ui-placeholder')).toBeTruthy();
});
