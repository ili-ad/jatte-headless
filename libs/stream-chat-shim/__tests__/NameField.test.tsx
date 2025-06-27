import React from 'react';
import { render } from '@testing-library/react';
import { NameField } from '../src/components/Poll/PollCreationDialog/NameField';

test('renders without crashing', () => {
  render(<NameField />);
});
