import React from 'react';
import { render } from '@testing-library/react';
import { MessageErrorText } from '../src/MessageErrorText';

test('renders placeholder', () => {
  const { getByTestId } = render(<MessageErrorText />);
  expect(getByTestId('message-error-text-placeholder')).toBeTruthy();
});
