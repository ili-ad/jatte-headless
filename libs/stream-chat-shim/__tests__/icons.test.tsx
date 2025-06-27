
import React from 'react';
import { render } from '@testing-library/react';
import { MenuIcon, ReturnIcon, XIcon, SearchIcon } from '../src/components/ChannelSearch/icons';

test('renders without crashing', () => {
  render(<MenuIcon />);
  render(<ReturnIcon />);
  render(<XIcon />);
  render(<SearchIcon className='' />);

});
