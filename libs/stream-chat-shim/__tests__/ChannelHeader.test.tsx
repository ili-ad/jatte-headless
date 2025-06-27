import React from 'react';
import { render } from '@testing-library/react';
import { ChannelHeader } from '../src/components/ChannelHeader/ChannelHeader';

test('renders channel header', () => {
  const { container } = render(<ChannelHeader />);
  expect(container.querySelector('.str-chat__channel-header')).toBeTruthy();
});
