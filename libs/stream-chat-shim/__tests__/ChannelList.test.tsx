import React from 'react';
import { render } from '@testing-library/react';
import { ChannelList } from '../src/components/ChannelList/ChannelList';

test('renders without crashing', () => {
  render(<ChannelList />);
});
