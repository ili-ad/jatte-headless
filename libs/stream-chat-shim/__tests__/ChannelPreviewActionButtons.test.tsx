import React from 'react';
import { render } from '@testing-library/react';

import { ChannelPreviewActionButtons } from '../src/components/ChannelPreview/ChannelPreviewActionButtons';

test('renders without crashing', () => {
  render(<ChannelPreviewActionButtons channel={{} as any} />);
});
