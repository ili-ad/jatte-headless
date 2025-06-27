import React from 'react';
import { render } from '@testing-library/react';
import { StartRecordingAudioButton } from '../src/components/MediaRecorder/AudioRecorder/AudioRecordingButtons';

test('renders without crashing', () => {
  render(<StartRecordingAudioButton />);
});
