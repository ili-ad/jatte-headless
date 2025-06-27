import { getImageAttachmentConfiguration, getVideoAttachmentConfiguration } from '../src/components/Attachment/attachment-sizing';

describe('attachment-sizing helpers', () => {
  test('getImageAttachmentConfiguration returns url', () => {
    const el = document.createElement('div');
    el.style.height = '100px';
    el.style.maxWidth = '200px';
    const config = getImageAttachmentConfiguration(
      { image_url: 'https://example.com/img.png?oh=100&ow=100' } as any,
      el,
    );
    expect(config.url).toContain('https://');
  });

  test('getVideoAttachmentConfiguration returns thumb url', () => {
    const el = document.createElement('div');
    el.style.height = '100px';
    el.style.maxWidth = '200px';
    const config = getVideoAttachmentConfiguration(
      {
        thumb_url: 'https://example.com/thumb.png?oh=100&ow=100',
        asset_url: 'https://example.com/video.mp4',
      } as any,
      el,
      true,
    );
    expect(config.thumbUrl).toContain('https://');
  });
});
