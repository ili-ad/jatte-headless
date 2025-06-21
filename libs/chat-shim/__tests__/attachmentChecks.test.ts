import { isImageAttachment, isVideoAttachment, isAudioAttachment } from '../index';

describe('attachment type helpers', () => {
  test('isImageAttachment', () => {
    expect(isImageAttachment({ mime_type: 'image/png' })).toBe(true);
    expect(isImageAttachment({ name: 'photo.JPG' })).toBe(true);
    expect(isImageAttachment({ mime_type: 'video/mp4' })).toBe(false);
  });

  test('isVideoAttachment', () => {
    expect(isVideoAttachment({ mime_type: 'video/mp4' })).toBe(true);
    expect(isVideoAttachment({ name: 'clip.webm' })).toBe(true);
    expect(isVideoAttachment({ mime_type: 'audio/mp3' })).toBe(false);
  });

  test('isAudioAttachment', () => {
    expect(isAudioAttachment({ mime_type: 'audio/mpeg' })).toBe(true);
    expect(isAudioAttachment({ name: 'sound.wav' })).toBe(true);
    expect(isAudioAttachment({ mime_type: 'image/png' })).toBe(false);
  });
});
