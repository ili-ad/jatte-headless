import React from 'react';
import { render } from '@testing-library/react';
import { ArrowDown, ArrowUp, CloseIcon } from '../src/components/MessageList/icons';

test('renders MessageList icons', () => {
  render(<ArrowDown />);
  render(<ArrowUp />);
  render(<CloseIcon />);
});
