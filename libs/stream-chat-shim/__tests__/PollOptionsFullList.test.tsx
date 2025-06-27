import { render } from '@testing-library/react';
import React from 'react';
import { PollOptionsFullList } from '../src/components/Poll/PollActions/PollOptionsFullList';

test('renders without crashing', () => {
  render(<PollOptionsFullList />);
});
