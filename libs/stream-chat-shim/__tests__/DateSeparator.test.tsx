import React from 'react';
import { render } from '@testing-library/react';
import { DateSeparator } from '../src/components/DateSeparator/DateSeparator';

test('renders without crashing', () => {
  render(<DateSeparator date={new Date()} />);
});
