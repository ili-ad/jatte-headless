import React from 'react';
import { render } from '@testing-library/react';
import { SafeAnchor } from '../src/components/SafeAnchor';

test('renders without crashing', () => {
  render(<SafeAnchor href='http://example.com'>Link</SafeAnchor>);
});
