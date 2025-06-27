import React from 'react';
import { render } from '@testing-library/react';
import { UnreadCountBadge } from '../src/components/Threads/UnreadCountBadge';

test('renders without crashing', () => {
  render(<UnreadCountBadge count={1}>child</UnreadCountBadge>);
});
