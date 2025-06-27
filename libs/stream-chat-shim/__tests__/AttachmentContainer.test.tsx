import React from 'react';
import { render } from '@testing-library/react';
import { AttachmentContainer } from '../src/components/Attachment/AttachmentContainer';

test('renders without crashing', () => {
  render(
    <AttachmentContainer
      attachment={{} as any}
      componentType="image"
    />,
  );
});
