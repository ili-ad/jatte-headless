import React from 'react';
import { render } from '@testing-library/react';
import { GiphyPreviewMessage } from '../src/components/MessageList/GiphyPreviewMessage';

test('renders giphy preview message', () => {
  const { container } = render(<GiphyPreviewMessage message={{} as any} />);
  expect(container.querySelector('.giphy-preview-message')).toBeTruthy();
});
