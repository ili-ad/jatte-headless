import React from 'react';
import { render } from '@testing-library/react';
import { Avatar } from '../src/components/Avatar/Avatar';

test('renders without crashing', () => {
  render(<Avatar />);
});
