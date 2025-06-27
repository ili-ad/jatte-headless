import React from 'react';
import { render } from '@testing-library/react';
import { PollOptionVotesList } from '../src/components/Poll/PollActions/PollResults/PollOptionVotesList';
import type { PollOption } from 'chat-shim';

test('renders without crashing', () => {
  const option: PollOption = { id: '1', poll_id: '1', text: 'Option 1' } as any;
  render(<PollOptionVotesList option={option} />);
});
