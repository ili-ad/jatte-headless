import React from 'react';
import { render } from '@testing-library/react';
import { MultipleAnswersField } from '../src/components/Poll/PollCreationDialog/MultipleAnswersField';
test('renders without crashing', () => {
  render(<MultipleAnswersField />);
});
