import React from 'react';
import { render } from '@testing-library/react';
import { AudioRecordingPreview } from '../src/components/MediaRecorder/AudioRecorder/AudioRecordingPreview';

test('renders without crashing', () => {
  render(<AudioRecordingPreview durationSeconds={0} />);
});
