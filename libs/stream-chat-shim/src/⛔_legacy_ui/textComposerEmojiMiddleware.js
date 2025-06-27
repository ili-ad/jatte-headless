"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextComposerEmojiMiddleware = void 0;
var DEFAULT_OPTIONS = { minChars: 1, trigger: ':' };
/**
 * Placeholder implementation of Stream's `createTextComposerEmojiMiddleware`.
 *
 * The real middleware queries an emoji search index and updates the
 * composer state with emoji suggestions. This stub simply forwards all
 * calls without modification.
 */
var createTextComposerEmojiMiddleware = function (_emojiSearchIndex, _options) { return ({
    id: 'stream-io/emoji-middleware',
    handlers: {
        onChange: function (_a) {
            var forward = _a.forward;
            return forward();
        },
        onSuggestionItemSelect: function (_a) {
            var forward = _a.forward;
            return forward();
        },
    },
}); };
exports.createTextComposerEmojiMiddleware = createTextComposerEmojiMiddleware;
exports.default = exports.createTextComposerEmojiMiddleware;
