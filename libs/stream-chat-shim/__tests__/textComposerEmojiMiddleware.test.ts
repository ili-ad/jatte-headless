import { createTextComposerEmojiMiddleware } from '../src/textComposerEmojiMiddleware';

describe('createTextComposerEmojiMiddleware', () => {
  test('returns middleware with default handlers', () => {
    const emojiSearchIndex = { search: jest.fn() } as any;
    const mw = createTextComposerEmojiMiddleware(emojiSearchIndex);
    expect(mw.id).toBe('stream-io/emoji-middleware');
    expect(typeof mw.handlers.onChange).toBe('function');
    expect(typeof mw.handlers.onSuggestionItemSelect).toBe('function');
  });
});
