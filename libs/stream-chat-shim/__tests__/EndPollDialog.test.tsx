import { render } from '@testing-library/react';
import React from 'react';
import { EndPollDialog } from '../src/components/Poll/PollActions/EndPollDialog';

describe('EndPollDialog', () => {
  test('renders without crashing', () => {
    render(<EndPollDialog close={() => {}} />);
  });
});
