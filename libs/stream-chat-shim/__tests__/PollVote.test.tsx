import React from 'react';
import { render } from '@testing-library/react';
import { PollVote } from '../src/PollVote';

test('renders placeholder', () => {
  const { getByTestId } = render(
    <PollVote vote={{ id: '1', poll_id: 'p', created_at: '', updated_at: '' }} />
  );
  expect(getByTestId('poll-vote-placeholder')).toBeTruthy();
});
