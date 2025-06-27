import React from 'react';
import { render } from '@testing-library/react';
import { AudioRecorder } from '../src/components/MediaRecorder/AudioRecorder/AudioRecorder';

test('renders without crashing', () => {
  render(<AudioRecorder />);
});
