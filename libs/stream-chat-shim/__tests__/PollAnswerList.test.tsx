import React from 'react';
import { render } from '@testing-library/react';
import { PollAnswerList } from '../src/components/Poll/PollActions/PollAnswerList';

test('renders without crashing', () => {
  render(<PollAnswerList onUpdateOwnAnswerClick={() => {}} />);
});
