import React from 'react';
import { render } from '@testing-library/react';
import { ImageAttachmentPreview } from '../src/components/MessageInput/AttachmentPreviewList/ImageAttachmentPreview';

test('renders without crashing', () => {
  render(
    <ImageAttachmentPreview
      attachment={{ localMetadata: {} } as any}
      handleRetry={() => {}}
      removeAttachments={() => {}}
    />,
  );
});
