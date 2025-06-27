import React from 'react';
import { render } from '@testing-library/react';
import { PollActions } from '../src/components/Poll/PollActions/PollActions';

test('renders without crashing', () => {
  render(<PollActions />);
});
