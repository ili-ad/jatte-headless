import React from 'react';
import { render } from '@testing-library/react';
import { CloseIconRound } from '../src/components/Modal/icons';

test('renders CloseIconRound without crashing', () => {
  render(<CloseIconRound />);
});
