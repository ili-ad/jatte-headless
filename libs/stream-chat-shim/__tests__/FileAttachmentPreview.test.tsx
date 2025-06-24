import React from 'react';
import { render } from '@testing-library/react';
import { FileAttachmentPreview } from '../src/FileAttachmentPreview';

test('renders placeholder', () => {
  const { getByTestId } = render(
    <FileAttachmentPreview attachment={{ title: 'Document' } as any} />,
  );
  expect(getByTestId('file-attachment-preview-placeholder')).toBeTruthy();
});
