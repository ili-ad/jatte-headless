import React from 'react';
import { render } from '@testing-library/react';
import { ImageAttachmentPreview } from '../src/ImageAttachmentPreview';

describe('ImageAttachmentPreview', () => {
  it('renders placeholder', () => {
    const { getByTestId } = render(
      <ImageAttachmentPreview attachment={{}} as any />
    );
    expect(getByTestId('image-attachment-preview-placeholder')).toBeTruthy();
  });
});
