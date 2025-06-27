import React from 'react';
import { render } from '@testing-library/react';
import { EmptyStateIndicator } from '../src/components/EmptyStateIndicator';

test('renders without crashing', () => {
  render(<EmptyStateIndicator />);
});
