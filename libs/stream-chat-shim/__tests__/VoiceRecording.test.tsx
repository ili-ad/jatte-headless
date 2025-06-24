/// <reference types="jest" />
import React from 'react';
import { render } from '@testing-library/react';
import { VoiceRecording } from '../src/VoiceRecording';

test('renders placeholder', () => {
  const { getByTestId } = render(<VoiceRecording attachment={{}} />);
  expect(getByTestId('voice-recording-placeholder')).toBeTruthy();
});
