import React from 'react';
import { render } from '@testing-library/react';
import { PollResults } from '../src/components/Poll/PollActions/PollResults';

test('renders without crashing', () => {
  render(<PollResults />);
});
