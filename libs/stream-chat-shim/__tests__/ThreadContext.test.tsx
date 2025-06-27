import React from 'react';
import { render } from '@testing-library/react';
import { ThreadProvider } from '../src/components/Threads/ThreadContext';

test('renders without crashing', () => {
  render(<ThreadProvider />);
});
