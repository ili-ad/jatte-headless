import React from 'react';
import { render } from '@testing-library/react';
import { ReactionsList } from '../src/components/Reactions/ReactionsList';

test('renders without crashing', () => {
  const { getByTestId } = render(<ReactionsList />);
  expect(getByTestId('reaction-list')).toBeTruthy();
});
