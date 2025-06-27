import React from 'react';
import { render } from '@testing-library/react';
import { Timestamp } from '../src/components/Message/Timestamp';

test('renders without crashing', () => {
  render(<Timestamp />);
});
