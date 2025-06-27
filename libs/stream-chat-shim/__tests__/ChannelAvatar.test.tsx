import React from 'react';
import { render } from '@testing-library/react';
import { ChannelAvatar } from '../src/components/Avatar/ChannelAvatar';

test('renders without crashing', () => {
  render(<ChannelAvatar />);
});
