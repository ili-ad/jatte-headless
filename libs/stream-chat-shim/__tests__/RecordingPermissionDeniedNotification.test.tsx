import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecordingPermissionDeniedNotification } from '../src/components/MediaRecorder/RecordingPermissionDeniedNotification';

describe('RecordingPermissionDeniedNotification component', () => {
  it('renders translation text', () => {
    const html = renderToStaticMarkup(
      <RecordingPermissionDeniedNotification permissionName="camera" onClose={() => {}} />
    );
    expect(html).toContain('str-chat__recording-permission-denied-notification');
  });
});
