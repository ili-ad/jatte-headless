import React from 'react';
import { render } from '@testing-library/react';
import { ChannelPreview } from '../src/ChannelPreview';

test('renders placeholder', () => {
  const { getByTestId } = render(<ChannelPreview channel={{} as any} />);
  expect(getByTestId('channel-preview-placeholder')).toBeTruthy();
});
