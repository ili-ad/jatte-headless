import React from 'react';
import { render } from '@testing-library/react';
import { ReactionSelector } from '../src/components/Reactions/ReactionSelector';

test('renders without crashing', () => {
  render(<ReactionSelector />);
});
