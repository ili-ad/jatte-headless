import React from 'react';
import { render } from '@testing-library/react';
import { MultipleAnswersField } from '../src/MultipleAnswersField';

test('renders placeholder', () => {
  const { getByTestId } = render(<MultipleAnswersField />);
  expect(getByTestId('multiple-answers-field-placeholder')).toBeTruthy();
});
