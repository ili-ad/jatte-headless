import React from 'react';
import { render } from '@testing-library/react';
import { Gallery } from '../src/components/Gallery/Gallery';

test('renders without crashing', () => {
  render(<Gallery images={[]} />);
});
