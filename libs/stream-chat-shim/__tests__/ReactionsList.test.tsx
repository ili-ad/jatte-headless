import React from 'react';
import { render } from '@testing-library/react';
import { ReactionsList } from '../src/ReactionsList';

test('renders placeholder', () => {
  const { getByTestId } = render(<ReactionsList />);
  expect(getByTestId('reactions-list')).toBeTruthy();
});
