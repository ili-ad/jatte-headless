import React from 'react';
import { render } from '@testing-library/react';
import { UnsupportedAttachmentPreview } from '../src/components/MessageInput/AttachmentPreviewList/UnsupportedAttachmentPreview';

test('renders without crashing', () => {
  render(
    <UnsupportedAttachmentPreview
      attachment={{} as any}
      handleRetry={() => undefined}
      removeAttachments={() => undefined}
    />,
  );
});
