import React from 'react';
import { render } from '@testing-library/react';
import { SuggestPollOptionForm } from '../src/components/Poll/PollActions/SuggestPollOptionForm';

test('renders without crashing', () => {
  render(<SuggestPollOptionForm close={() => {}} messageId="" />);
});
