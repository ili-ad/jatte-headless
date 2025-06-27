import React from 'react';
import { render } from '@testing-library/react';
import { VoiceRecordingPreview } from '../src/components/MessageInput/AttachmentPreviewList/VoiceRecordingPreview';

test('renders without crashing', () => {
  render(
    <VoiceRecordingPreview
      attachment={{} as any}
      handleRetry={() => {}}
      removeAttachments={() => {}}
    />
  );
});
