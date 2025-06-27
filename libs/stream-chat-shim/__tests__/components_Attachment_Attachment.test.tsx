import React from 'react';
import { render } from '@testing-library/react';
import { Attachment } from '../src/components/Attachment/Attachment';

test('renders without crashing', () => {
  render(<Attachment attachments={[]} />);
});
