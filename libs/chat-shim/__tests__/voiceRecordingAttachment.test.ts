/// <reference types="jest" />
import { isVoiceRecordingAttachment } from '../index';

describe('isVoiceRecordingAttachment', () => {
  it('detects audio attachments with waveform', () => {
    const a = { mime_type: 'audio/mpeg', waveform: [0, 1, 0] };
    expect(isVoiceRecordingAttachment(a)).toBe(true);
  });

  it('rejects audio attachments without waveform', () => {
    const a = { mime_type: 'audio/wav' };
    expect(isVoiceRecordingAttachment(a)).toBe(false);
  });

  it('rejects non-audio attachments even with waveform', () => {
    const a = { mime_type: 'video/mp4', waveform: [0] };
    expect(isVoiceRecordingAttachment(a)).toBe(false);
  });
});
