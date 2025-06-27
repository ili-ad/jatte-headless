import React from 'react';
import { render } from '@testing-library/react';
import { AttachmentActions } from '../src/components/Attachment/AttachmentActions';

test('renders without crashing', () => {
  render(<AttachmentActions actions={[]} id="1" text="" /> as any);
});
