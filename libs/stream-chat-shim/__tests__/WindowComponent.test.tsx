import React from 'react';
import { render } from '@testing-library/react';
import { Window } from '../src/components/Window/Window';

test('renders without crashing', () => {
  render(<Window />);
});
