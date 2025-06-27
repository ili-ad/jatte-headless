import { render } from '@testing-library/react';
import React from 'react';
import { OptionFieldSet } from '../src/components/Poll/PollCreationDialog/OptionFieldSet';

test('renders without crashing', () => {
  render(<OptionFieldSet />);
});
