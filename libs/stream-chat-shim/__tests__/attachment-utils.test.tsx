import { displayDuration, isGalleryAttachmentType, SUPPORTED_VIDEO_FORMATS } from '../src/attachment-utils';

describe('attachment-utils', () => {
  test('displayDuration formats seconds', () => {
    expect(displayDuration(0)).toBe('00:00');
    expect(displayDuration(70)).toBe('01:10');
    expect(displayDuration(3661)).toBe('01:01:01');
  });

  test('isGalleryAttachmentType detects gallery', () => {
    const gallery = { images: [], type: 'gallery' };
    expect(isGalleryAttachmentType(gallery)).toBe(true);
    expect(isGalleryAttachmentType({} as any)).toBe(false);
  });

  test('SUPPORTED_VIDEO_FORMATS has common formats', () => {
    expect(SUPPORTED_VIDEO_FORMATS).toContain('video/mp4');
  });
});
