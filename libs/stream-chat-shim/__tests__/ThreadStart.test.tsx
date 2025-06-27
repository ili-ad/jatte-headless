import React from 'react';
import { render } from '@testing-library/react';
import { ThreadStart } from '../src/components/Thread/ThreadStart';

test('renders without crashing', () => {
  render(<ThreadStart />);
});
