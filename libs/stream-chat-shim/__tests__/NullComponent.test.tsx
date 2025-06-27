import { render } from '@testing-library/react';
import React from 'react';
import { NullComponent } from '../src/components/UtilityComponents';

test('renders without crashing', () => {
  render(<NullComponent />);
});
