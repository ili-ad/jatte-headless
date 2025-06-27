"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var textComposerEmojiMiddleware_1 = require("../src/textComposerEmojiMiddleware");
describe('createTextComposerEmojiMiddleware', function () {
    test('returns middleware with default handlers', function () {
        var emojiSearchIndex = { search: jest.fn() };
        var mw = (0, textComposerEmojiMiddleware_1.createTextComposerEmojiMiddleware)(emojiSearchIndex);
        expect(mw.id).toBe('stream-io/emoji-middleware');
        expect(typeof mw.handlers.onChange).toBe('function');
        expect(typeof mw.handlers.onSuggestionItemSelect).toBe('function');
    });
});
