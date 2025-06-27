import React from 'react';
import { render } from '@testing-library/react';
import { MenuIcon } from '../src/components/ChannelHeader/icons';

test('renders without crashing', () => {
  render(<MenuIcon />);
});
