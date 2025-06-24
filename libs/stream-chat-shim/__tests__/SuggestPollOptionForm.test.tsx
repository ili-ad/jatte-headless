import React from 'react';
import { render } from '@testing-library/react';
import { SuggestPollOptionForm } from '../src/SuggestPollOptionForm';

test('renders placeholder', () => {
  const { getByTestId } = render(<SuggestPollOptionForm />);
  expect(getByTestId('suggest-poll-option-form-placeholder')).toBeTruthy();
});
