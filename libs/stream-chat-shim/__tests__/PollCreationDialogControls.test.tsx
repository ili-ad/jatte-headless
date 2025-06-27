import React from 'react';
import { render } from '@testing-library/react';
import { PollCreationDialogControls } from '../src/components/Poll/PollCreationDialog/PollCreationDialogControls';

test('renders without crashing', () => {
  render(<PollCreationDialogControls close={() => {}} />);
});
