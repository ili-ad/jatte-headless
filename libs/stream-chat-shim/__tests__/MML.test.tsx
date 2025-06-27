import { render } from '@testing-library/react';
import React from 'react';
import { MML } from '../src/components/MML/MML';

test('renders without crashing', () => {
  render(<MML source="" />);
});
