import React from 'react';
import { render } from '@testing-library/react';
import { BaseImage } from '../src/components/Gallery/BaseImage';

test('renders without crashing', () => {
  render(<BaseImage />);
});
