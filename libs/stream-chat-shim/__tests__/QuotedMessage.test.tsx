import React from 'react';
import { render } from '@testing-library/react';
import { QuotedMessage } from '../src/components/Message/QuotedMessage';

test('renders without crashing', () => {
  render(<QuotedMessage />);
});
