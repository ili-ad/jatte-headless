import React from 'react';
import { render } from '@testing-library/react';
import { AudioRecordingInProgress } from '../src/components/MediaRecorder/AudioRecorder/AudioRecordingInProgress';

test('renders without crashing', () => {
  render(<AudioRecordingInProgress />);
});
