import React from 'react';
import { render } from '@testing-library/react';
import { ThreadListUnseenThreadsBanner } from '../src/components/Threads/ThreadList/ThreadListUnseenThreadsBanner';

test('renders without crashing', () => {
  render(<ThreadListUnseenThreadsBanner />);
});
