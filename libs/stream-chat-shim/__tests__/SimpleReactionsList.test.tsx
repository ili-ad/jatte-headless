import React from 'react';
import { render } from '@testing-library/react';
import { SimpleReactionsList } from '../src/components/Reactions/SimpleReactionsList';

test('renders without crashing', () => {
  render(<SimpleReactionsList />);
});
