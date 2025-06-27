import React from 'react';
import { render } from '@testing-library/react';
import { PollOptionList } from '../src/components/Poll/PollOptionList';

test('renders without crashing', () => {
  render(<PollOptionList />);
});
