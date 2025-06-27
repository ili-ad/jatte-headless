import React from 'react';
import { render } from '@testing-library/react';
import { VoiceRecording } from '../src/components/Attachment/VoiceRecording';

test('renders without crashing', () => {
  render(<VoiceRecording attachment={{}} />);
});
