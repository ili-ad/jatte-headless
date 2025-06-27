import React from 'react';
import { render } from '@testing-library/react';
import { FileAttachmentPreview } from '../src/components/MessageInput/AttachmentPreviewList/FileAttachmentPreview';

test('renders without crashing', () => {
  render(
    <FileAttachmentPreview
      attachment={{} as any}
      handleRetry={() => {}}
      removeAttachments={() => {}}
    />
  );
});
