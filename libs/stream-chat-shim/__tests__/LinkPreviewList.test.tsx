import React from 'react';
import { render } from '@testing-library/react';
import { LinkPreviewList } from '../src/components/MessageInput/LinkPreviewList';

test('renders without crashing', () => {
  render(<LinkPreviewList />);
});
