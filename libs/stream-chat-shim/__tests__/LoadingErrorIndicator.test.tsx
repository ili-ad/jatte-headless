import React from 'react';
import { render } from '@testing-library/react';
import { LoadingErrorIndicator } from '../src/components/Loading/LoadingErrorIndicator';

test('renders without crashing', () => {
  render(<LoadingErrorIndicator />);
});
