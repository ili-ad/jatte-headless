import React from 'react';
import { render } from '@testing-library/react';
import { Channel } from '../src/components/Channel/Channel';

test('renders without crashing', () => {
  render(<Channel />);
});
