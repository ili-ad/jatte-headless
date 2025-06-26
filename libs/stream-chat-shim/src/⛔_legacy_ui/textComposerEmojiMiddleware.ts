import type {
  Middleware,
  TextComposerMiddlewareExecutorState,
  TextComposerMiddlewareOptions,
  TextComposerSuggestion,
} from 'stream-chat';
import type { EmojiSearchIndex, EmojiSearchIndexResult } from './MessageInput';

/** Suggestion type used by the emoji middleware. */
export type EmojiSuggestion<T extends EmojiSearchIndexResult = EmojiSearchIndexResult> =
  TextComposerSuggestion<T>;

/** Middleware type used by the text composer for emoji handling. */
export type EmojiMiddleware<T extends EmojiSearchIndexResult = EmojiSearchIndexResult> =
  Middleware<TextComposerMiddlewareExecutorState<EmojiSuggestion<T>>, 'onChange' | 'onSuggestionItemSelect'>;

const DEFAULT_OPTIONS: TextComposerMiddlewareOptions = { minChars: 1, trigger: ':' };

/**
 * Placeholder implementation of Stream's `createTextComposerEmojiMiddleware`.
 *
 * The real middleware queries an emoji search index and updates the
 * composer state with emoji suggestions. This stub simply forwards all
 * calls without modification.
 */
export const createTextComposerEmojiMiddleware = (
  _emojiSearchIndex: EmojiSearchIndex,
  _options?: Partial<TextComposerMiddlewareOptions>,
): EmojiMiddleware => ({
  id: 'stream-io/emoji-middleware',
  handlers: {
    onChange: ({ forward }) => forward(),
    onSuggestionItemSelect: ({ forward }) => forward(),
  },
});

export default createTextComposerEmojiMiddleware;
