import React from 'react';
import { render } from '@testing-library/react';
import { Gallery } from '../src/Gallery';

test('renders placeholder', () => {
  const { getByTestId } = render(<Gallery images={[]} />);
  expect(getByTestId('gallery-placeholder')).toBeTruthy();
});
