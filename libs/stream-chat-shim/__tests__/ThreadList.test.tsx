import React from 'react';
import { render } from '@testing-library/react';
import { ThreadList } from '../src/components/Threads/ThreadList/ThreadList';

test('renders without crashing', () => {
  render(<ThreadList />);
});
