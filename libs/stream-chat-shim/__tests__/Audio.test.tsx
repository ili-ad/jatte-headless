import React from 'react';
import { render } from '@testing-library/react';
import { Audio } from '../src/Attachment/Audio';

test('renders without crashing', () => {
  render(
    <Audio
      og={{ asset_url: 'a.mp3', file_size: 123, mime_type: 'audio/mpeg', title: 'a' } as any}
    />
  );
});
