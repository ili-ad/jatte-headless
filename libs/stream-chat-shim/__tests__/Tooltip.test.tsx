import React from 'react';
import { render } from '@testing-library/react';
import { Tooltip } from '../src/components/Tooltip/Tooltip';

test('renders without crashing', () => {
  render(<Tooltip />);
});
