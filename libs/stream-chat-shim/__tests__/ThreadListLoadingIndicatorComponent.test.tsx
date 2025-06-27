import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListLoadingIndicator } from '../src/components/Threads/ThreadList/ThreadListLoadingIndicator';

test('renders without crashing', () => {
  render(<ThreadListLoadingIndicator />);
});

