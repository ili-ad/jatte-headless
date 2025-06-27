import React from 'react';
import { render } from '@testing-library/react';
import { ImageComponent } from '../src/components/Gallery/Image';

test('renders without crashing', () => {
  render(<ImageComponent />);
});
