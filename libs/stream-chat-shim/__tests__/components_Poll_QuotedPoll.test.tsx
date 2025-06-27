import React from 'react';
import { render } from '@testing-library/react';
import { QuotedPoll } from '../src/components/Poll/QuotedPoll';

test('renders without crashing', () => {
  render(<QuotedPoll />);
});
