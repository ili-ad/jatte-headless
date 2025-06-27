import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListItemUI } from '../src/components/Threads/ThreadList/ThreadListItemUI';

test('renders without crashing', () => {
  render(<ThreadListItemUI />);
});
