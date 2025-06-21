import { 
  isLocalAttachment,
  isLocalUploadAttachment,
  isLocalImageAttachment,
  isLocalVideoAttachment,
  isLocalAudioAttachment,
  isLocalFileAttachment,
  isLocalVoiceRecordingAttachment,
} from '../index';

describe('local attachment helpers', () => {
  const makeFile = (name: string, type: string) => new File(['x'], name, { type });

  test('isLocalAttachment via file or state', () => {
    expect(isLocalAttachment({ file: makeFile('a.png', 'image/png') })).toBe(true);
    expect(isLocalAttachment({ state: 'uploading' })).toBe(true);
    expect(isLocalAttachment({})).toBe(false);
  });

  test('isLocalUploadAttachment checks uploading state', () => {
    expect(isLocalUploadAttachment({ state: 'uploading' })).toBe(true);
    expect(isLocalUploadAttachment({ file: makeFile('a.txt', 'text/plain') })).toBe(false);
  });

  test('isLocalImageAttachment', () => {
    expect(
      isLocalImageAttachment({ file: makeFile('pic.gif', 'image/gif') })
    ).toBe(true);
  });

  test('isLocalVideoAttachment', () => {
    expect(
      isLocalVideoAttachment({ file: makeFile('clip.webm', 'video/webm') })
    ).toBe(true);
  });

  test('isLocalAudioAttachment', () => {
    expect(
      isLocalAudioAttachment({ file: makeFile('sound.mp3', 'audio/mp3') })
    ).toBe(true);
  });

  test('isLocalVoiceRecordingAttachment', () => {
    expect(
      isLocalVoiceRecordingAttachment({ file: makeFile('rec.wav', 'audio/wav'), waveform: [] })
    ).toBe(true);
  });

  test('isLocalFileAttachment acts as fallback', () => {
    expect(
      isLocalFileAttachment({ file: makeFile('doc.pdf', 'application/pdf') })
    ).toBe(true);
  });
});
