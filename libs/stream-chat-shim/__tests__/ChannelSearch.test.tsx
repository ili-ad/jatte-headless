import React from 'react';
import { render } from '@testing-library/react';
import { ChannelSearch } from '../src/components/ChannelSearch/ChannelSearch';

test('renders without crashing', () => {
  render(<ChannelSearch />);
});
