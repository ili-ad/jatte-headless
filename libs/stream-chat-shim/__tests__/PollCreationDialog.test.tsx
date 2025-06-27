import React from 'react';
import { render } from '@testing-library/react';
import { PollCreationDialog } from '../src/components/Poll/PollCreationDialog/PollCreationDialog';

test('renders without crashing', () => {
  render(<PollCreationDialog close={() => {}} />);
});
