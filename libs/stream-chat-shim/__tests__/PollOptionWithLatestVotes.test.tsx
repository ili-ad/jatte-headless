import React from 'react';
import { render } from '@testing-library/react';
import { PollOptionWithLatestVotes } from '../src/components/Poll/PollActions/PollResults/PollOptionWithLatestVotes';

test('renders without crashing', () => {
  render(
    <PollOptionWithLatestVotes option={{ id: '1', text: 'Opt' } as any} />,
  );
});
