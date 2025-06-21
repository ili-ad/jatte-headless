import { isFileAttachment, isScrapedContent } from '../index';

describe('attachment helpers', () => {
  test('detect scraped content', () => {
    expect(isScrapedContent({ og_scrape_url: 'http://x' })).toBe(true);
    expect(isScrapedContent({})).toBe(false);
  });

  test('file vs media detection', () => {
    expect(isFileAttachment({ mime_type: 'image/png' })).toBe(false);
    expect(isFileAttachment({ mime_type: 'video/mp4' })).toBe(false);
    expect(isFileAttachment({ mime_type: 'audio/mp3' })).toBe(false);
    expect(isFileAttachment({ og_scrape_url: 'http://x' })).toBe(false);
    expect(isFileAttachment({ mime_type: 'application/pdf' })).toBe(true);
  });
});
