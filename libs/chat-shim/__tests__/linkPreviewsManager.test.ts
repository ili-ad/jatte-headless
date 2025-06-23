import { LinkPreviewsManager, LinkPreviewStatus } from '../index';

describe('LinkPreviewsManager', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://example.com', title: 'Example' })
    }) as any;
  });

  test('fetches and caches results', async () => {
    const mgr = new LinkPreviewsManager(2);
    const first = await mgr.fetch('https://example.com');
    expect(global.fetch).toHaveBeenCalledWith('/api/link-preview?url=https%3A%2F%2Fexample.com');
    (global.fetch as jest.Mock).mockClear();
    const second = await mgr.fetch('https://example.com');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(second).toBe(first);
    expect(first.status).toBe(LinkPreviewStatus.loaded);
  });
});
