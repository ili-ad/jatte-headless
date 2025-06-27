import React from 'react';
import { render } from '@testing-library/react';
import { PollHeader } from '../src/components/Poll/PollHeader';

test('renders without crashing', () => {
  render(<PollHeader />);
});
