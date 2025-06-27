import React from 'react';
import { render } from '@testing-library/react';
import { ModalGallery } from '../src/components/Gallery/ModalGallery';

test('renders without crashing', () => {
  render(<ModalGallery images={[]} />);
});
