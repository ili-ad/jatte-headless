import React from 'react';
import { render } from '@testing-library/react';
import { VoiceRecordingPreview } from '../src/VoiceRecordingPreview';

test('renders placeholder', () => {
  const { getByTestId } = render(
    <VoiceRecordingPreview
      attachment={{} as any}
      handleRetry={() => {}}
      removeAttachments={() => {}}
    />
  );
  expect(getByTestId('voice-recording-preview-placeholder')).toBeTruthy();
});
