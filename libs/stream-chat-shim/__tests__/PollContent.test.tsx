import React from 'react';
import { render } from '@testing-library/react';
import { PollContent } from '../src/components/Poll/PollContent';

test('renders without crashing', () => {
  render(<PollContent />);
});
