import { render } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../src/components/UtilityComponents/ErrorBoundary';

test('renders without crashing', () => {
  render(
    <ErrorBoundary>
      <div>child</div>
    </ErrorBoundary>
  );
});
