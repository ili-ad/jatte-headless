import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecordingTimer } from '../src/components/MediaRecorder/AudioRecorder/RecordingTimer';

describe('RecordingTimer component', () => {
  test('renders duration', () => {
    const html = renderToStaticMarkup(<RecordingTimer durationSeconds={10} />);
    expect(html).toContain('10');
  });
});
