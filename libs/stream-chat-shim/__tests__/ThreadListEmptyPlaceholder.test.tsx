import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListEmptyPlaceholder } from '../src/components/Threads/ThreadList/ThreadListEmptyPlaceholder';

test('renders without crashing', () => {
  render(<ThreadListEmptyPlaceholder />);
});
