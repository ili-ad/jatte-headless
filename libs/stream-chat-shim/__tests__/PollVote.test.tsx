import React from 'react';
import { render } from '@testing-library/react';
import { PollVote } from '../src/components/Poll/PollVote';

test('renders without crashing', () => {
  render(
    <PollVote
      vote={{ id: '1', poll_id: 'p', created_at: '', updated_at: '' } as any }
    />,
  );
});
