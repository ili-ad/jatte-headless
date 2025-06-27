import React from 'react';
import { render } from '@testing-library/react';
import { FileAttachment } from '../src/components/Attachment/FileAttachment';

test('renders without crashing', () => {
  render(<FileAttachment attachment={{} as any} />);
});
