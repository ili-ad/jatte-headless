import React from 'react';
import { render } from '@testing-library/react';
import { LoadingIndicator } from '../src/components/Loading/LoadingIndicator';

test('renders without crashing', () => {
  render(<LoadingIndicator />);
});
