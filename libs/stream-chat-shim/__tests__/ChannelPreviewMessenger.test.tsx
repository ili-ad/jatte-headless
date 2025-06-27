import React from 'react';
import { render } from '@testing-library/react';
import { ChannelPreviewMessenger } from '../src/components/ChannelPreview/ChannelPreviewMessenger';

test('renders without crashing', () => {
  render(
    <ChannelPreviewMessenger
      active={false}
      channel={{} as any}
      unread={0}
    />,
  );
});
