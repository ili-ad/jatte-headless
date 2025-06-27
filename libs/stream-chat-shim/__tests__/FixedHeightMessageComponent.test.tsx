import React from 'react';
import { render } from '@testing-library/react';
import { FixedHeightMessage } from '../src/components/Message/FixedHeightMessage';

test('renders without crashing', () => {
  render(<FixedHeightMessage />);
});
