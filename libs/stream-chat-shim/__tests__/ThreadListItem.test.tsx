import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListItem } from '../src/components/Threads/ThreadList/ThreadListItem';

test('renders without crashing', () => {
  render(<ThreadListItem thread={{} as any} />);
});
