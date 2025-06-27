import React from 'react';
import { render } from '@testing-library/react';
import { CloseIcon } from '../src/components/Thread/icons';

test('renders thread icons without crashing', () => {
  render(<CloseIcon />);
});
