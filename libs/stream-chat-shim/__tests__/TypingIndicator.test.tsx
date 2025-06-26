import React from 'react';
import { render } from '@testing-library/react';
import { TypingIndicator } from '../src/TypingIndicator/TypingIndicator';

test('renders without crashing', () => {
  render(<TypingIndicator />);
});
