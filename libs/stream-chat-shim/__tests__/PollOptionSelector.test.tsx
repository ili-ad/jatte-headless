import React from 'react';
import { render } from '@testing-library/react';
import { PollOptionSelector } from '../src/PollOptionSelector';

test('renders placeholder', () => {
  const { getByTestId } = render(
    <PollOptionSelector option={{} as any} />,
  );
  expect(getByTestId('poll-option-selector-placeholder')).toBeTruthy();
});
