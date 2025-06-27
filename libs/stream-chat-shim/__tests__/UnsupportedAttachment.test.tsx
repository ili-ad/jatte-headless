import React from 'react';
import { render } from '@testing-library/react';
import { UnsupportedAttachment } from '../src/components/Attachment/UnsupportedAttachment';

test('renders without crashing', () => {
  render(<UnsupportedAttachment attachment={{}} as any />);
});
