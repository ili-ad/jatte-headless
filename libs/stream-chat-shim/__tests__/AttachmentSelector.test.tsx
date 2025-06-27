import React from 'react';
import { render } from '@testing-library/react';
import { AttachmentSelector } from '../src/components/MessageInput/AttachmentSelector';

test('renders without crashing', () => {
  render(<AttachmentSelector />);
});
