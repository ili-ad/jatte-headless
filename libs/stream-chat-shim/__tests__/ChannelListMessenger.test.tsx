import React from 'react';
import { render } from '@testing-library/react';
import { ChannelListMessenger } from '../src/components/ChannelList/ChannelListMessenger';

test('renders without crashing', () => {
  render(<ChannelListMessenger error={null} />);
});
